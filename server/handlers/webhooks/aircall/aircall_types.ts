export interface AircallWebhookRequest {
  event: string;
  timestamp: number;
  id: string;
  data: AircallCallData;
}

export interface AircallCallData {
  id: number;
  direct_link: string;
  started_at: number;
  answered_at?: number | null;
  ended_at?: number | null;
  direction: "inbound" | "outbound";
  status: string;
  raw_digits: string | null;
  number: AircallNumber;
  user?: AircallUser | null;
  contact?: AircallContact | null;
}

export interface AircallNumber {
  id: number;
  name: string | null;
  digits: string;
}

export interface AircallUser {
  id: number;
  name: string;
  email: string;
}

export interface AircallContact {
  id: number;
  first_name: string | null;
  last_name: string | null;
  phone_numbers: Array<{ label: string; value: string }>;
}