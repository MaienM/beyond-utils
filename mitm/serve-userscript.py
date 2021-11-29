""" --set termlog_verbosity=debug
Serve the userscript a D&D Beyond url.

The userscript will be taken from (in order):
	- The local dev server (started with `pnpm run dev`).
	- The local build (`dist/main.user.js`, built with either `pnpm run build:dev` or `pnpm run build:prod`).
	- The latest build from GitHub.
"""

from datetime import datetime, timedelta
from json import loads
from pathlib import Path
from subprocess import run, PIPE
from typing import (
	NamedTuple,
	Optional,
	Sequence,
	Set,
)
from urllib.error import URLError
from urllib.request import urlopen

from mitmproxy import ctx, flowfilter, version
from mitmproxy.addonmanager import Loader
from mitmproxy.exceptions import OptionsError
from mitmproxy.flow import Flow
from mitmproxy.http import Response
from mitmproxy.net.check import is_valid_host, is_valid_port
from mitmproxy.net.http.url import parse as parse_url, unparse as unparse_url

from log import log


GET_CONFIG_SCRIPT_PATH = Path(__file__).parent / 'get-webpack-settings.js'
UPSTREAM_CACHE_TIMEOUT = timedelta(hours=1)


class ParsedURL(NamedTuple):
	scheme: bytes
	host: bytes
	port: int
	path: bytes


class WebpackConfig(NamedTuple):
	dev_server_host: str
	dev_server_port: int
	build_dir: Path
	upstream_url: str


def _load_webpack_config() -> WebpackConfig:
	log.debug(f'Getting config from webpack config using {GET_CONFIG_SCRIPT_PATH}.')
	proc = run(['node', GET_CONFIG_SCRIPT_PATH], stdout=PIPE)
	log.debug(f'Output: {proc.stdout}.')
	config = loads(proc.stdout)

	dev_server_host = config.get('dev_server_host', None)
	assert isinstance(dev_server_host, str), f'dev_server_host must be a string, got {dev_server_host}.'
	assert is_valid_host(dev_server_host), f'dev_server_host must be a valid IP or hostname, got {dev_server_host}.'
	if dev_server_host == '0.0.0.0':
		dev_server_host = '127.0.0.1'
	log.debug(f'Local dev server will use host {dev_server_host}.')

	dev_server_port = config.get('dev_server_port', None)
	if isinstance(dev_server_port, str):
		try:
			dev_server_port = int(dev_server_port, 10)
		except ValueError:
			pass
	assert isinstance(dev_server_port, int), f'dev_server_port must be a number, got {dev_server_port}.'
	assert is_valid_port(dev_server_port), f'dev_server_port must be a valid port, got {dev_server_port}.'
	log.debug(f'Local dev server will use port {dev_server_port}.')

	build_dir = config.get('build_dir', None)
	assert isinstance(build_dir, str), f'build_dir must be a string, got {build_dir}.'
	build_dir = Path(build_dir)
	log.debug(f'Local builds will be in {build_dir}.')

	upstream_url = config.get('upstream_url', None)
	assert isinstance(upstream_url, str), f'upstream_url must be a string, got {upstream_url}.'
	try:
		parse_url(upstream_url)
	except ValueError as e:
		assert False, f'upstream_url must be a valid URL, got {upstream_url} ({e}).'
	log.debug(f'Upstream builds will be at {upstream_url}.')

	return WebpackConfig(dev_server_host, dev_server_port, build_dir, upstream_url)


class ServeUserscript(object):
	def __init__(self) -> None:
		webpack_config = _load_webpack_config()
		filename = Path(ParsedURL(*parse_url(webpack_config.upstream_url)).path.decode('utf-8')).name
		self.dev_server_url = unparse_url('http', webpack_config.dev_server_host, webpack_config.dev_server_port, f'/{filename}')
		self.build_path = webpack_config.build_dir / filename
		self.upstream_url = webpack_config.upstream_url
		log.info(f'Userscript sources (in order): {self.dev_server_url}, {self.build_path}, {self.upstream_url}')

		self.filter: flowfilter.TFilter = None

		self._upstream_response_cache: Optional[str] = None
		self._upstream_response_cache_timeout: datetime = datetime.now() - UPSTREAM_CACHE_TIMEOUT

	def load(self, loader: Loader) -> None:
		loader.add_option(
			'serve_userscript', Optional[str], None,
			'Flow filter to serve the userscript at.'
		)

	def configure(self, updated: Set[str]) -> None:
		if 'serve_userscript' not in updated:
			return
		if ctx.options.serve_userscript:
			try:
				self.filter = flowfilter.parse(ctx.options.serve_userscript)
			except Exception as e:
				raise OptionsError(f'Cannot parse serve_userscript option {option}: {e}.') from e
		else:
			self.filter = None

	def request(self, flow: Flow) -> None:
		if flow.response or flow.error or (flow.reply and flow.reply.state == 'taken'):
			return
		if not (self.filter and self.filter(flow)):
			return

		headers = {
			'server': version.MITMPROXY,
		}

		script = self._get_script()
		if not script:
			flow.response = Response.make(404, None, headers)
			return

		headers['content-type'] = 'application/javascript'
		flow.response = Response.make(200, script, headers)

	def _get_script(self) -> Optional[bytes]:
		methods: List[Tuple[str, Function[bytes]]] = [
			('local devserver', self._get_script_devserver),
			('local build', self._get_script_build),
			('upstream', self._get_script_upstream),
		]
		for name, method in methods:
			script = method()
			if script:
				log.info(f'Got userscript from {name}.')
				return script
		return None

	def _get_script_devserver(self) -> Optional[str]:
		return self._get_script_url(self.dev_server_url)

	def _get_script_build(self) -> Optional[bytes]:
		try:
			with open(self.build_path, 'rb') as f:
				return f.read()
		except IOError:
			return None

	def _get_script_upstream(self) -> Optional[bytes]:
		now = datetime.now()
		if not self._upstream_response_cache or self._upstream_response_cache_timeout < now:
			self._upstream_response_cache = self._get_script_url(self.upstream_url)
			self._upstream_response_cache_timeout = now + UPSTREAM_CACHE_TIMEOUT
		return self._upstream_response_cache

	@staticmethod
	def _get_script_url(url) -> Optional[bytes]:
		try:
			with urlopen(url) as response:
				return response.read()
		except URLError:
			return None


addons = [
	ServeUserscript()
]
