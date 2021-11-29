from typing import Any

from click import secho
from mitmproxy import ctx
from mitmproxy.addonmanager import Loader
from mitmproxy.log import LogTierOrder, log_tier


class BULog():
	def load(self, loader: Loader):
		loader.add_option(
			"bulog_verbosity", str, 'info',
			"Log verbosity for Beyond Utils specific logs.",
			choices=LogTierOrder
		)

	def debug(self, *args) -> None: self(*args, level='debug')
	def info(self, *args) -> None: self(*args, level='info')
	def alert(self, *args) -> None: self(*args, level='alert')
	def warn(self, *args) -> None: self(*args, level='warn')
	def error(self, *args) -> None: self(*args, level='error')

	def __call__(self, *args, level: LogTierOrder = 'info') -> None:
		if log_tier(ctx.options.bulog_verbosity) < log_tier(level):
			return
		secho(
			' '.join(str(arg) for arg in args),
			fg=dict(error="red", warn="yellow", alert="magenta").get(level),
			dim=(level == "debug"),
			err=(level == "error"),
		)


log = BULog()

addons = [log]
