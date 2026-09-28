import {
  Activity,
  Droplets,
  Fan,
  FlaskConical,
  Gauge,
  RefreshCw,
  Sprout,
  Thermometer,
  ThermometerSun,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { ActuatorKind, AlertCode } from "@/lib/domain";

export const SENSOR_ICON: Record<AlertCode, LucideIcon> = {
  airTemp: Thermometer,
  humidity: Droplets,
  waterLevel: Waves,
  ph: FlaskConical,
  ec: Activity,
  waterTemp: ThermometerSun,
  do: Wind,
  pumpFault: Gauge,
};

export const ACTUATOR_ICON: Record<ActuatorKind, LucideIcon> = {
  pump: Droplets,
  aeration: Fan,
  irrigation: Sprout,
  circulation: RefreshCw,
};

/** Actuators whose icon should rotate while running. */
export const SPINS: Partial<Record<ActuatorKind, boolean>> = { aeration: true, circulation: true };
