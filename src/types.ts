export interface ConditionOption {
  id: string;
  label: string;
}

export interface ConditionGroup {
  id: string;
  label: string;
  options: ConditionOption[];
}

export interface TravelIntent {
  destination: string;
  purposes: string[];
  transportWish: string;
  travelStyle: string;
  stamina: string;
  co2Kg: number;
  budgetYen: number;
  fatigueScore: number;
  aiComment: string;
}

export type PlanCategory = 'original' | 'recommended' | 'similar';

export interface ScheduleStep {
  time: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface TravelPlan {
  id: string;
  name: string;
  label?: string;
  category?: PlanCategory;
  icon: string;
  transport: string;
  description: string;
  tags: string[];
  co2: number;
  fatigue: number;
  cost: number;
  spotCount: string;
  walkingDistance: number;
  relaxScore: number;
  schedule: ScheduleStep[];
}

export interface EcoAction {
  id: string;
  title: string;
  description: string;
  points: number;
  defaultOn: boolean;
}

export interface RatingCategory {
  id: string;
  label: string;
}

export interface VisitHistoryItem {
  id: string;
  label: string;
  planName: string;
  date: string;
  isCurrentTrip?: boolean;
}
