import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TournamentCategory {
  id: string;
  name: string;
  ageGroups: string[];
  isDouble?: boolean;
  fee?: number;
  deposit?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  requirements?: string;
}

export interface Tournament {
  id: string;
  title: string;
  regStartTime: string;
  regEndTime: string;
  matchStartTime: string;
  matchEndTime: string;
  location: string;
  status: 'registration' | 'ongoing' | 'finished';
  type: 'Individual' | 'Team' | 'Comprehensive';
  image: string;
  participants: number;
  description: string;
  contactPerson: string;
  contactPhone: string;
  documents: { name: string; url: string }[];
  categories: TournamentCategory[];
  fee?: number;
  allowMultiCategory?: boolean;
  maxParticipants?: number;
  organizer?: string;
}

export interface SubMatch {
  id: string;
  category: string;
  player1: string;
  player2: string;
  score1: number[];
  score2: number[];
  status: 'live' | 'upcoming' | 'finished';
  winner?: 1 | 2;
}

export interface Match {
  id: string;
  tournamentId: string;
  player1: string;
  player2: string;
  score1: number[];
  score2: number[];
  status: 'live' | 'upcoming' | 'finished';
  court: string;
  time: string;
  category?: string;
  isWalkover?: boolean;
  winner?: 1 | 2;
  type?: 'Individual' | 'Team';
  subMatches?: SubMatch[];
  teamScore1?: number;
  teamScore2?: number;
}

export type IDType =
  | 'ID_CARD'
  | 'HK_MACAU_RESIDENCE'
  | 'TAIWAN_RESIDENCE'
  | 'FOREIGNER_PERMANENT_RESIDENCE'
  | 'HK_MACAU_PERMIT'
  | 'TAIWAN_PERMIT'
  | 'PASSPORT';

export type Gender = 'MALE' | 'FEMALE';
export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '';

export interface ParticipantInfo {
  name: string;
  phone: string;
  idType: IDType;
  idNumber: string;
  gender: Gender;
  birthDate: string;
  clothingSize: ClothingSize;
}

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  leader?: string | ParticipantInfo;
  coach?: string;
  members: ParticipantInfo[];
  uniformImage?: string;
  uniformColor?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  distance: string;
  price: number;
  image: string;
  tags: string[];
  lat: number;
  lng: number;
  courts: number;
  phone: string;
  facilities: string[];
  description: string;
  bookingType: 'platform' | 'mini-program' | 'phone';
}

export interface TimeSlot {
  time: string;
  price: number;
  status: 'available' | 'booked' | 'selected';
}

export interface PartnerRequest {
  id: string;
  user: {
    name: string;
    avatar: string;
    level: string;
  };
  title: string;
  time: string;
  location: string;
  currentPlayers: number;
  maxPlayers: number;
  description: string;
  tags: string[];
}
