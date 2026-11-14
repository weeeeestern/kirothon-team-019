export interface Coordinate { lat: number; lng: number }
export interface Place extends Coordinate { id: string; name: string; address: string; district?: string }
export interface TransitSegment {
  type: 'subway' | 'bus' | 'walk';
  label: string;
  /** Minutes. */
  time: number;
  /** Meters. */
  distance?: number;
  from?: string;
  to?: string;
  stations?: string[];
  /** True only when the provider supplied a passing-stop list. */
  stopsComplete?: boolean;
  line?: string;
  path?: Coordinate[];
}
export interface TransitJourney {
  id: string;
  /** Minutes; estimate from ODsay, not a departure-time timetable. */
  totalTime: number;
  /** Walking distance in meters, NOT minutes. */
  totalWalk: number;
  /** Korean won. */
  payment: number;
  transferCount: number;
  segments: TransitSegment[];
  path: Coordinate[];
  stations: string[];
  provider: 'ODsay';
  /** Stops means schematic straight connections, not street-level geometry. */
  pathKind?: 'geometry' | 'stops';
}
