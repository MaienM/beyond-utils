import iconCreatureAlligator from './icons/creature-alligator.svg';
import iconCreatureBear from './icons/creature-bear.svg';
import iconCreatureBoar from './icons/creature-boar.svg';
import iconCreatureCamel from './icons/creature-camel.svg';
import iconCreatureCrab from './icons/creature-crab.svg';
import iconCreatureDeer from './icons/creature-deer.svg';
import iconCreatureDonkey from './icons/creature-donkey.svg';
import iconCreatureDragon from './icons/creature-dragon.svg';
import iconCreatureEagle from './icons/creature-eagle.svg';
import iconCreatureElephant from './icons/creature-elephant.svg';
import iconCreatureFox from './icons/creature-fox.svg';
import iconCreatureGoat from './icons/creature-goat.svg';
import iconCreatureHorse from './icons/creature-horse.svg';
import iconCreatureIguana from './icons/creature-iguana.svg';
import iconCreatureLion from './icons/creature-lion.svg';
import iconCreatureMammoth from './icons/creature-mammoth.svg';
import iconCreatureMastiff from './icons/creature-mastiff.svg';
import iconCreatureMoose from './icons/creature-moose.svg';
import iconCreatureOctopus from './icons/creature-octopus.svg';
import iconCreatureOwl from './icons/creature-owl.svg';
import iconCreaturePanther from './icons/creature-panther.svg';
import iconCreaturePterodactyl from './icons/creature-pterodactyl.svg';
import iconCreatureSaberToothedTiger from './icons/creature-saber-toothed-tiger.svg';
import iconCreatureShark from './icons/creature-shark.svg';
import iconCreatureSpider from './icons/creature-spider.svg';
import iconCreatureTiger from './icons/creature-tiger.svg';
import iconCreatureTriceratops from './icons/creature-triceratops.svg';
import iconCreatureTurtle from './icons/creature-turtle.svg';
import iconCreatureUnicorn from './icons/creature-unicorn.svg';
import iconCreatureWalrus from './icons/creature-walrus.svg';
import iconCreatureWhale from './icons/creature-whale.svg';
import iconCreatureWolf from './icons/creature-wolf.svg';
import iconCreatureZebra from './icons/creature-zebra.svg';
import iconItemBackpack from './icons/item-backpack.svg';
import iconItemBagOfHolding from './icons/item-bag-of-holding.svg';
import iconItemChest from './icons/item-chest.svg';
import iconItemHandyHaversack from './icons/item-handy-haversack.svg';
import iconItemPortableHole from './icons/item-portable-hole.svg';
import iconItemPouch from './icons/item-pouch.svg';
import iconItemSack from './icons/item-sack.svg';
import iconOnPerson from './icons/person.svg';
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

export interface ContainerIcon {
	readonly key: string;
	readonly element: SVGSVGElement;
	readonly name: string;
}

export const ICON_UNKNOWN: ContainerIcon = { key: 'unknown', element: iconUnknown, name: 'Unknown' };
export const ICON_ON_PERSON: ContainerIcon = { key: 'onPerson', element: iconOnPerson, name: 'On-Person' };
export const ICONS: Record<string, ContainerIcon> = {
	unknown: ICON_UNKNOWN,
	creatureAlligator: { key: 'creatureAlligator', element: iconCreatureAlligator, name: 'Alligator (Creature)' },
	creatureBear: { key: 'creatureBear', element: iconCreatureBear, name: 'Bear (Creature)' },
	creatureBoar: { key: 'creatureBoar', element: iconCreatureBoar, name: 'Boar (Creature)' },
	creatureCamel: { key: 'creatureCamel', element: iconCreatureCamel, name: 'Camel (Creature)' },
	creatureCrab: { key: 'creatureCrab', element: iconCreatureCrab, name: 'Crab (Creature)' },
	creatureDeer: { key: 'creatureDeer', element: iconCreatureDeer, name: 'Deer (Creature)' },
	creatureDonkey: { key: 'creatureDonkey', element: iconCreatureDonkey, name: 'Donkey (Creature)' },
	creatureDragon: { key: 'creatureDragon', element: iconCreatureDragon, name: 'Dragon (Creature)' },
	creatureEagle: { key: 'creatureEagle', element: iconCreatureEagle, name: 'Eagle (Creature)' },
	creatureElephant: { key: 'creatureElephant', element: iconCreatureElephant, name: 'Elephant (Creature)' },
	creatureFox: { key: 'creatureFox', element: iconCreatureFox, name: 'Fox (Creature)' },
	creatureGoat: { key: 'creatureGoat', element: iconCreatureGoat, name: 'Goat (Creature)' },
	creatureHorse: { key: 'creatureHorse', element: iconCreatureHorse, name: 'Horse (Creature)' },
	creatureIguana: { key: 'creatureIguana', element: iconCreatureIguana, name: 'Iguana (Creature)' },
	creatureLion: { key: 'creatureLion', element: iconCreatureLion, name: 'Lion (Creature)' },
	creatureMammoth: { key: 'creatureMammoth', element: iconCreatureMammoth, name: 'Mammoth (Creature)' },
	creatureMastiff: { key: 'creatureMastiff', element: iconCreatureMastiff, name: 'Mastiff (Creature)' },
	creatureMoose: { key: 'creatureMoose', element: iconCreatureMoose, name: 'Moose (Creature)' },
	creatureOctopus: { key: 'creatureOctopus', element: iconCreatureOctopus, name: 'Octopus (Creature)' },
	creatureOwl: { key: 'creatureOwl', element: iconCreatureOwl, name: 'Owl (Creature)' },
	creaturePanther: { key: 'creaturePanther', element: iconCreaturePanther, name: 'Panther (Creature)' },
	creaturePterodactyl: { key: 'creaturePterodactyl', element: iconCreaturePterodactyl, name: 'Pterodactyl (Creature)' },
	creatureSaberToothedTiger: { key: 'creatureSaberToothedTiger', element: iconCreatureSaberToothedTiger, name: 'Sabertooth Tiger (Creature)' },
	creatureShark: { key: 'creatureShark', element: iconCreatureShark, name: 'Shark (Creature)' },
	creatureSpider: { key: 'creatureSpider', element: iconCreatureSpider, name: 'Spider (Creature)' },
	creatureTiger: { key: 'creatureTiger', element: iconCreatureTiger, name: 'Tiger (Creature)' },
	creatureTriceratops: { key: 'creatureTriceratops', element: iconCreatureTriceratops, name: 'Triceratops (Creature)' },
	creatureTurtle: { key: 'creatureTurtle', element: iconCreatureTurtle, name: 'Turtle (Creature)' },
	creatureUnicorn: { key: 'creatureUnicorn', element: iconCreatureUnicorn, name: 'Unicorn (Creature)' },
	creatureWalrus: { key: 'creatureWalrus', element: iconCreatureWalrus, name: 'Walrus (Creature)' },
	creatureWhale: { key: 'creatureWhale', element: iconCreatureWhale, name: 'Whale (Creature)' },
	creatureWolf: { key: 'creatureWolf', element: iconCreatureWolf, name: 'Wolf (Creature)' },
	creatureZebra: { key: 'creatureZebra', element: iconCreatureZebra, name: 'Zebra (Creature)' },
	itemBackpack: { key: 'itemBackpack', element: iconItemBackpack, name: 'Backpack (Item)' },
	itemBagOfHolding: { key: 'itemBagOfHolding', element: iconItemBagOfHolding, name: 'Bag of Holding (Item)' },
	itemChest: { key: 'itemChest', element: iconItemChest, name: 'Chest (Item)' },
	itemHandyHaversack: { key: 'itemHandyHaversack', element: iconItemHandyHaversack, name: 'Handy Haversack (Item)' },
	itemPortableHole: { key: 'itemPortableHole', element: iconItemPortableHole, name: 'Portable Hole (Item)' },
	itemPouch: { key: 'itemPouch', element: iconItemPouch, name: 'Pouch (Item)' },
	itemSack: { key: 'itemSack', element: iconItemSack, name: 'Sack (Item)' },
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
