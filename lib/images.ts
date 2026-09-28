import circularLoop from "@/assets/images/circular-loop.jpg";
import distribution from "@/assets/images/distribution.jpg";
import farmHero from "@/assets/images/farm-hero.jpg";
import iotMonitoring from "@/assets/images/iot-monitoring.jpg";
import smartFarm from "@/assets/images/smart-farm.jpg";
import teamField from "@/assets/images/team-field.jpg";
import deviana from "@/assets/images/team/deviana-sarmento.jpg";
import escolastico from "@/assets/images/team/escolastico-sarmento.jpg";
import yuma from "@/assets/images/team/yuma-rafi.jpg";
import type { StaticImageData } from "next/image";

/** VIEM's own imagery, extracted from the company profile. */
export const BRAND = {
  farmHero: { src: farmHero, alt: "VIEM circular farm: NFT lettuce channels over a tilapia tank beside a free-range poultry run" },
  smartFarm: { src: smartFarm, alt: "Connected VIEM farm with solar panel, sensor box, hydroponic racks and a tablet showing the VIEM dashboard" },
  teamField: { src: teamField, alt: "VIEM team members kneeling among lettuce rows, reviewing data on a tablet at sunset" },
  circularLoop: { src: circularLoop, alt: "Water flowing from the fish tank to grow beds, with compost and larvae bins feeding back into the loop" },
  iotMonitoring: { src: iotMonitoring, alt: "Operator checking sensor readings on a tablet beside an aquaponic tank and solar-powered monitoring pole" },
  distribution: { src: distribution, alt: "Farmer harvesting greens while crates of fresh produce are loaded into a VIEM delivery truck" },
} satisfies Record<string, { src: StaticImageData; alt: string }>;

export const TEAM_PHOTOS = { deviana, yuma, escolastico };

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop`;

/**
 * Supporting photography from Unsplash (free licence). Sized by Unsplash's
 * own CDN through the loader in components/ui/Photo.tsx.
 */
export const PHOTO = {
  forestAerial: { src: unsplash("1511207538754-e8555f2bc187"), alt: "Dark green forest canopy" },
  forestCanopy: { src: unsplash("1550627951-4ebb041775ee"), alt: "Aerial view of dense tree canopy" },
  lushForest: { src: unsplash("1728050448200-b3c965d7c4e2"), alt: "Lush green tropical forest" },
  palmCanopy: { src: unsplash("1621146027714-e8921770f8d0"), alt: "Palm fronds and tropical foliage in a dark forest canopy" },
  leafDroplets: { src: unsplash("1675865253317-5c362d874552"), alt: "Water droplets on a green leaf" },
  coastAerial: { src: unsplash("1553242018-6496a076bd3d"), alt: "Aerial view of an island coastline and turquoise sea" },
  hillsView: { src: unsplash("1698737474049-2858da07eaff"), alt: "Green hills and mountains seen from a hilltop" },
  townMountains: { src: unsplash("1717551725335-5e1dcd57a491"), alt: "Aerial view of a small town below the mountains" },
  townOcean: { src: unsplash("1707445305630-5962c1e9e1e9"), alt: "A town and the ocean seen from a hillside" },
  coastRoad: { src: unsplash("1746438413259-417694f5c775"), alt: "A coastal road winding along a verdant mountain" },
  treesWater: { src: unsplash("1591325408953-ef9298125f96"), alt: "Green trees beside calm water under a blue sky" },
  lettuceRows: { src: unsplash("1533321942807-08e4008b2025"), alt: "Rows of fresh butter lettuce heads" },
  hydroTower: { src: unsplash("1682629088818-1ec55d0cf45b"), alt: "Vertical hydroponic tower with plants growing inside" },
  greenhouse: { src: unsplash("1727099079513-952d40de9d78"), alt: "Greenhouse filled with green plants" },
  verticalFarm: { src: unsplash("1784601758625-9dcefc5a2b71"), alt: "Vertical farm growing leafy greens" },
  growLights: { src: unsplash("1774291981971-ec2ec7a8cd0e"), alt: "Rows of green plants growing in channels" },
  greenhouseTeam: { src: unsplash("1758524056596-af1c19797d01"), alt: "Two people examining plants in a greenhouse" },
  nettedRows: { src: unsplash("1781332150710-5da0ab262a0b"), alt: "Aerial view of crop rows under protective shade netting" },
  lettuceClose: { src: unsplash("1515356956468-873dd257f911"), alt: "Close-up of fresh lettuce leaves" },
  lettuceBunch: { src: unsplash("1692606280428-7df25e4daefb"), alt: "A bunch of freshly harvested lettuce" },
  fishPond: { src: unsplash("1731552466988-26d1dbeff4ee"), alt: "Fish swimming together in a pond" },
  fishSchool: { src: unsplash("1607629194532-53c98b8180da"), alt: "Orange and silver fish in water" },
  fishHands: { src: unsplash("1769771861175-2cdcdf5108db"), alt: "Hands holding a small striped fish near water" },
  fishMarket: { src: unsplash("1783408355128-c6a45a91c130"), alt: "Fresh fish displayed at a market stall" },
  solarPanel: { src: unsplash("1508514177221-188b1cf16e9d"), alt: "Solar panel under a blue sky" },
  solarField: { src: unsplash("1670519808728-335b1eb2ef52"), alt: "Solar panels in a green field" },
  seedlings: { src: unsplash("1611843467160-25afb8df1074"), alt: "Hands planting seedlings in garden soil" },
  soilHands: { src: unsplash("1584747420644-5c767eebcbe6"), alt: "Hands holding rich brown soil" },
  compostBoxes: { src: unsplash("1716903282677-3a1b5c936b41"), alt: "Wooden boxes filled with compost" },
  market: { src: unsplash("1747396108528-682b02327818"), alt: "Fresh produce for sale at a busy market" },
  marketBuyers: { src: unsplash("1783309239665-6952be593dac"), alt: "People buying fresh vegetables at a market stall" },
  marketElder: { src: unsplash("1777777375326-7625e19a987b"), alt: "Elderly woman at a market stall with produce" },
  satelliteDish: { src: unsplash("1526666923127-b2970f64b422"), alt: "Satellite dish standing in a field" },
  satelliteSky: { src: unsplash("1590433333434-09df2b2a35a5"), alt: "White satellite dish under a blue sky" },
  circuitBoard: { src: unsplash("1640955785023-1854685dae05"), alt: "Tweezers placing a microchip onto a green circuit board" },
  phoneField: { src: unsplash("1586819158505-d7f6227d19d4"), alt: "A person holding up a mobile phone in a field" },
  farmerPhone: { src: unsplash("1642439994493-3816a23c997a"), alt: "A man standing in a field looking at his phone" },
  boyPlant: { src: unsplash("1581578017306-7334b15283df"), alt: "A boy holding a young green plant" },
  boyWatering: { src: unsplash("1611735341450-74d61e660ad2"), alt: "A boy standing beside a watering can in a garden" },
  plantingBed: { src: unsplash("1621460248083-6271cc4437a8"), alt: "Person planting seedlings in a raised bed" },
} satisfies Record<string, { src: string; alt: string }>;
