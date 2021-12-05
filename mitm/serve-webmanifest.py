"""
Serve the character webmanifest on a D&D Beyond url.
"""

from asyncio import (
	CancelledError,
	Future,
	TimeoutError,
	create_task,
	get_running_loop,
	shield,
	sleep as async_sleep,
	wait_for,
)
from collections import defaultdict
from datetime import datetime, timedelta
from json import dumps, loads
from traceback import print_exc
from typing import Awaitable, Optional, Set

from mitmproxy import ctx, flowfilter, version
from mitmproxy.addonmanager import Loader
from mitmproxy.exceptions import OptionsError
from mitmproxy.flow import Flow
from mitmproxy.http import Request, Response

from log import log


class DataBroker(object):
	def __init__(self) -> None:
		self.ttls: Dict[str, datetime] = {}
		self.data: Dict[str, Optional[Union[Future, str]]] = {}
		self.is_task_running = False

	async def get(self, key: str) -> str:
		self._touch(key)
		dataorfuture = self.data[key]
		if dataorfuture is None:
			log.debug(f'[DB] Get for {key} happened before set, creating and awaiting future.')
			dataorfuture = get_running_loop().create_future()
			self.data[key] = dataorfuture
			return await shield(dataorfuture)
		elif isinstance(dataorfuture, Future):
			log.debug(f'[DB] Get for {key} happened before set, awaiting exising future.')
			return await shield(dataorfuture)
		else:
			log.debug(f'[DB] Get for {key} fulfilled from cache.')
			return dataorfuture

	def set(self, key: str, value: str) -> None:
		self._touch(key)
		dataorfuture = self.data[key]
		if isinstance(dataorfuture, Future):
			log.debug(f'[DB] Set for {key}, fulfilling pending future and setting cache.')
			dataorfuture.set_result(value)
		else:
			log.debug(f'[DB] Set for {key}, updating cache.')
		self.data[key] = value

	def _touch(self, key: str) -> None:
		self.ttls[key] = datetime.now() + timedelta(minutes=5)
		if key not in self.data:
			self.data[key] = None

		if not self.is_task_running:
			create_task(self._cleanup_task())

	async def _cleanup_task(self) -> None:
		self.is_task_running = True
		try:
			log.debug('[DB] Starting cleanup task.')
			while len(self.ttls) > 0:
				now = datetime.now()
				to_delete = []
				for key, ttl in self.ttls.items():
					if ttl < now:
						to_delete.append(key)
				for key in to_delete:
					log.debug(f'[DB] Cleanup {key}.')
					del self.data[key]
					del self.ttls[key]

				await async_sleep(30)
			log.debug(f'[DB] Cache is empty, exiting cleanup task.')
		finally:
			self.is_task_running = False


class ServeWebManifest(object):
	def __init__(self) -> None:
		self.webmanifest_filter: flowfilter.TFilter = None
		self.data_filter: flowfilter.TFilter = None
		self.data = DataBroker()

	def load(self, loader: Loader) -> None:
		loader.add_option(
			'serve_webmanifest', Optional[str], None,
			'Flow filter to serve the webmanifest at.'
		)
		loader.add_option(
			'serve_webmanifest_data', Optional[str], None,
			'Flow filter for request that must be captured to provide data for the webmanifest. This will be matched to a webmanifest request based on the referer.'
		)

	def configure(self, updated: Set[str]) -> None:
		if 'serve_webmanifest' in updated:
			if ctx.options.serve_webmanifest:
				try:
					self.webmanifest_filter = flowfilter.parse(ctx.options.serve_webmanifest)
				except Exception as e:
					raise OptionsError(f'Cannot parse serve_webmanifest option {option}: {e}.') from e
			else:
				self.webmanifest_filter = None

		if 'serve_webmanifest_data' in updated:
			if ctx.options.serve_webmanifest_data:
				try:
					self.data_filter = flowfilter.parse(ctx.options.serve_webmanifest_data)
				except Exception as e:
					raise OptionsError(f'Cannot parse serve_webmanifest_data option {option}: {e}.') from e
			else:
				self.data_filter = None

	def request(self, flow: Flow) -> None:
		if flow.response or flow.error or (flow.reply and flow.reply.state == 'taken'):
			return
		if not (self.webmanifest_filter and self.webmanifest_filter(flow)):
			return

		self._wrap_async(flow, self._async_request(flow))

	def _wrap_async(self, flow: Flow, awaitable: Awaitable) -> None:
		async def wrapper():
			try:
				await awaitable
			except:
				print_exc()
				flow.response = Response.make(500, None, { 'server': version.MITMPROXY })
			finally:
				flow.reply.commit()

		flow.reply.take()
		create_task(wrapper())

	async def _async_request(self, flow: Flow) -> None:
		referer = flow.request.headers['referer']
		log.info(f'Webmanifest request from {referer}.')
		headers = {
			'server': version.MITMPROXY,
		}

		try:
			character_info = await wait_for(self.data.get(referer), timeout=15)
		except (TimeoutError, CancelledError):
			log.error(f'Timeout while waiting for character data from {referer}.')
			flow.response = Response.make(404, b'', headers)
			return

		data = loads(character_info.decode('utf-8'))['data']
		character_name = data['name']
		avatar_url = data['decorations'].get('avatarUrl', None)
		manifest = {
			'name': f'{character_name} - D&D Beyond',
			'short_name': character_name,
			'description': 'An official digital toolset for Fifth Edition (5e) Dungeons & Dragons (D&D).',
			'icons': [],
			'display': 'fullscreen',
			'start_url': referer,
		}
		if avatar_url:
			manifest['icons'].append({
				'src': avatar_url,
				'sizes': '192x192',
				'type': 'image/webp',
			})
		else:
			manifest['icons'].append({
				'src': 'https://www.dndbeyond.com/Content/Skins/Waterdeep/images/characters/default-avatar-builder.png',
				'sizes': '192x192',
				'type': 'image/png',
			})

		headers['content-type'] = 'application/webmanifest+json'
		flow.response = Response.make(200, dumps(manifest).encode('utf-8'), headers)

	def response(self, flow: Flow) -> None:
		if flow.error or flow.reply.state == 'taken' or flow.request.method != 'GET':
			return
		if not (self.data_filter and self.data_filter(flow)):
			return

		referer = flow.request.headers['referer']
		log.info(f'Captured character info response for {referer}.')
		self.data.set(referer, flow.response.content)

addons = [
	ServeWebManifest()
]
