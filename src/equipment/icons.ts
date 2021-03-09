import iconItemBackpack from './icons/item-backpack.svg';
import iconItemBagOfHolding from './icons/item-bag-of-holding.svg';
import iconItemChest from './icons/item-chest.svg';
import iconItemHandyHaversack from './icons/item-handy-haversack.svg';
import iconItemPortableHole from './icons/item-portable-hole.svg';
import iconItemPouch from './icons/item-pouch.svg';
import iconItemSack from './icons/item-sack.svg';
import iconMountCamel from './icons/mount-camel.svg';
import iconMountDonkey from './icons/mount-donkey.svg';
import iconMountElephant from './icons/mount-elephant.svg';
import iconMountHorse from './icons/mount-horse.svg';
import iconMountMastiff from './icons/mount-mastiff.svg';
import iconPlaceCamp from './icons/place-camp.svg';
import iconPlaceCastle from './icons/place-castle.svg';
import iconPlaceCave from './icons/place-cave.svg';
import iconPlaceHouse from './icons/place-house.svg';
import iconPlaceTavern from './icons/place-tavern.svg';
import iconPlaceTower from './icons/place-tower.svg';
import iconUnknown from './icons/unknown.svg';
import iconVehicleCarriage from './icons/vehicle-carriage.svg';
import iconVehicleCart from './icons/vehicle-cart.svg';
import iconVehicleChariot from './icons/vehicle-chariot.svg';
import iconVehicleWagon from './icons/vehicle-wagon.svg';
import iconOnPerson from './icons/person.svg';

export interface ContainerIcon {
	readonly key: string;
	readonly element: SVGSVGElement;
	readonly name: string;
}

export const ICON_UNKNOWN: ContainerIcon = { key: 'unknown', element: iconUnknown, name: 'Unknown' };
export const ICON_ON_PERSON: ContainerIcon = { key: 'onPerson', element: iconOnPerson, name: 'On-Person' };
export const ICONS: Record<string, ContainerIcon> = {
	unknown: ICON_UNKNOWN,
	itemBackpack: { key: 'itemBackpack', element: iconItemBackpack, name: 'Backpack (Item)' },
	itemBagOfHolding: { key: 'itemBagOfHolding', element: iconItemBagOfHolding, name: 'Bag of Holding (Item)' },
	itemChest: { key: 'itemChest', element: iconItemChest, name: 'Chest (Item)' },
	itemHandyHaversack: { key: 'itemHandyHaversack', element: iconItemHandyHaversack, name: 'Handy Haversack (Item)' },
	itemPortableHole: { key: 'itemPortableHole', element: iconItemPortableHole, name: 'Portable Hole (Item)' },
	itemPouch: { key: 'itemPouch', element: iconItemPouch, name: 'Pouch (Item)' },
	itemSack: { key: 'itemSack', element: iconItemSack, name: 'Sack (Item)' },
	mountCamel: { key: 'mountCamel', element: iconMountCamel, name: 'Camel (Mount)' },
	mountDonkey: { key: 'mountDonkey', element: iconMountDonkey, name: 'Donkey (Mount)' },
	mountElephant: { key: 'mountElephant', element: iconMountElephant, name: 'Elephant (Mount)' },
	mountHorse: { key: 'mountHorse', element: iconMountHorse, name: 'Horse (Mount)' },
	mountMastiff: { key: 'mountMastiff', element: iconMountMastiff, name: 'Mastiff (Mount)' },
	placeCamp: { key: 'placeCamp', element: iconPlaceCamp, name: 'Camp (Place)' },
	placeCastle: { key: 'placeCastle', element: iconPlaceCastle, name: 'Castle (Place)' },
	placeCave: { key: 'placeCave', element: iconPlaceCave, name: 'Cave (Place)' },
	placeHouse: { key: 'placeHouse', element: iconPlaceHouse, name: 'House (Place)' },
	placeTavern: { key: 'placeTavern', element: iconPlaceTavern, name: 'Tavern (Place)' },
	placeTower: { key: 'placeTower', element: iconPlaceTower, name: 'Tower (Place)' },
	vehicleCarriage: { key: 'vehicleCarriage', element: iconVehicleCarriage, name: 'Carriage (Vehicle)' },
	vehicleCart: { key: 'vehicleCart', element: iconVehicleCart, name: 'Cart (Vehicle)' },
	vehicleChariot: { key: 'vehicleChariot', element: iconVehicleChariot, name: 'Chariot (Vehicle)' },
	vehicleWagon: { key: 'vehicleWagon', element: iconVehicleWagon, name: 'Wagon (Vehicle)' },
};
