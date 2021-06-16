/**
 * Wrapper around a single property, stored in localStorage.
 */
export class Setting<T extends string | number | boolean> {
	private key: string;

	private value: T;

	/**
	 * Create a new setting.
	 */
	constructor(key: string, defaultValue: T) {
		this.key = key;
		try {
			const storedValue = JSON.parse(localStorage.getItem(key) || '') as T;
			if (storedValue === null) {
				throw new Error('Unable to use stored value.');
			}
			this.value = storedValue;
		} catch {
			this.value = defaultValue;
		}
	}

	/**
	 * Get the current value of the setting.
	 */
	get(): T {
		return this.value;
	}

	/**
	 * Change the value of the setting.
	 */
	set(value: T): void {
		this.value = value;
		localStorage.setItem(this.key, JSON.stringify(value));
	}
}

export const ENABLE_MARKDOWN_NOTES = new Setting<boolean>('beyond-utils-enable-markdownify-notes', true);
export const ENABLE_MARKDOWN_EDITOR = new Setting<boolean>('beyond-utils-enable-markdownify-editor', true);
export const ENABLE_ITEM_CONTAINERS = new Setting<boolean>('beyond-utils-enable-item-containers', true);
export const ENABLE_LAYOUTS = new Setting<boolean>('beyond-utils-enable-layouts', true);

export const CURRENT_LAYOUT = new Setting<string>('beyond-utils-layout', 'default');
export const LAYOUTS_SWITCHER_LABELS = new Setting<boolean>('beyond-utils-layout-switcher-labels', false);
export const LAYOUTS_SWITCHER_COLORS = new Setting<number>('beyond-utils-layout-switcher-colors', 1);
