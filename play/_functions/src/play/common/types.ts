export type SeasonStatus = 'DRAFT' | 'CONFIG_REQUIRED' | 'READY' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ANALYZING' | 'ARCHIVED';
export type ClockStatus = 'INITIAL' | 'RUNNING' | 'PAUSED' | 'ERROR';
export type TransactionStatus = 'NORMAL' | 'TRANSACTION_PAUSED';

export interface PlaySeason {
  season_id: string;
  season_name: string;
  status: SeasonStatus;
  clock_status: ClockStatus;
  
  scenario_id: string;
  scenario_version: string;
  rule_version: string;
  supply_policy?: 'FIXED_ONE' | 'HOUSEHOLD_BASED';
  test_mode_speed?: number;
  base_interest?: number | string;
  inflation?: number | string;
  income_rate?: number | string;
  DSR?: number | string;
  LTV?: number | string;
  config?: {
    primary_supply_ratio?: number;
  };
  
  current_simulation_period: number;
  total_simulation_periods?: number;
  last_successful_period: number | null;
  last_successful_batch_id: string | null;
  
  transaction_status: TransactionStatus;
  
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  started_at?: FirebaseFirestore.Timestamp;
  closed_at?: FirebaseFirestore.Timestamp;
}

export type PlayerStatus = 'ACTIVE' | 'INACTIVE';

export interface PlayPlayer {
  player_id: string;
  user_id: string;
  season_id: string;
  status: PlayerStatus;
  joined_at: FirebaseFirestore.Timestamp;
  last_active_at: FirebaseFirestore.Timestamp;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface PlayPlayerAsset {
  player_id: string;
  season_id: string;
  
  cash_total: number;
  cash_available: number;
  cash_locked: number;
  
  debt_total: number;
  property_count: number;
  financial_asset_total: number;
  net_worth: number;
  annual_income?: number;
  monthly_income?: number;
  monthly_living_expense?: number;
  cumulative_inflation_factor?: number;
  monthly_loan_payment?: number;
  
  last_processed_period: number | null;
  last_processed_batch_id: string | null;
  processed_batches?: string[]; // Added for batch type idempotency
  last_processed_at: FirebaseFirestore.Timestamp | null;
  
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export type BatchStatus = 'PENDING' | 'DISPATCHING' | 'RUNNING' | 'AGGREGATING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface PlayBatch {
  inflation?: number | string;
  batch_id: string;
  season_id: string;
  simulation_period: number;
  batch_type: string;
  
  scenario_id: string;
  scenario_version: string;
  rule_version: string;
  base_interest?: number | string;
  income_rate?: number | string;
  
  expected_player_count: number;
  chunk_count: number;
  completed_chunks: number;
  failed_chunks: number;
  
  status: BatchStatus;
  
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  started_at?: FirebaseFirestore.Timestamp;
  completed_at?: FirebaseFirestore.Timestamp;
  
  error_code?: string;
  error_message?: string;
}

export type ChunkStatus = 'PENDING' | 'DISPATCHING' | 'DISPATCHED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface PlayBatchChunk {
  chunk_id: string;
  batch_id: string;
  season_id: string;
  
  simulation_period: number;
  batch_type: string;
  task_name: string;
  chunk_index: number;
  
  status: ChunkStatus;
  attempt_count: number;
  
  player_count: number;
  target_players?: string[]; // Added for absolute resolution stability
  processed_count: number;
  failed_count: number;
  
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  started_at?: FirebaseFirestore.Timestamp;
  completed_at?: FirebaseFirestore.Timestamp;
  
  last_error?: string;
}

export interface PlayIdempotencyLog {
  idempotency_key: string;
  season_id: string;
  batch_id?: string;
  chunk_id?: string;
  player_id?: string;
  
  simulation_period: number;
  operation_type: string;
  request_id?: string | null;
  
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
  completed_at?: FirebaseFirestore.Timestamp;
  
  result_reference?: string;
}
export interface PlayDecisionLog {  
  season_id: string;  
  player_id: string;  
  simulation_period: number;  
  batch_id?: string;  
  event_type?: string;
  action_type?: string;
  property_id?: string;
  transaction_id?: string;
  before_cash?: number;  
  income?: number;  
  living_expense?: number;  
  after_cash?: number;  
  before_net_worth?: number;  
  after_net_worth?: number;
  property_count_before?: number;
  property_count_after?: number;
  result?: string;
  reason?: string;
  created_at: FirebaseFirestore.Timestamp;  
  request_id?: string | null;  
  trace_id?: string | null;  
}

export type PropertyStatus = 'NORMAL' | 'INCOMPLETE';

export interface PlayPropertyMaster {
  property_id: string;
  supply_policy?: 'FIXED_ONE' | 'HOUSEHOLD_BASED';
  household_count_snapshot?: number;
  primary_supply_ratio?: number;
  complex_id: string;
  complex_name: string;
  property_status: PropertyStatus;
  tradable: boolean;
  household_count: number;
  representative_area_sqm: number | null;
  representative_area_pyeong: number | null;
  representative_area_index: number | null;
  initial_price: number | null;
  initial_price_date: string | null;
  legal_dong_address: string;
  road_name_address: string;
  x: number;
  y: number;
  region: string;
  source_file: string;
  snapshot_version: string;
  area_info_raw: string;
  sales_info_raw: string;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface PlayPrimarySupply {
  supply_id: string;
  season_id: string;
  property_id: string;
  supply_policy?: 'FIXED_ONE' | 'HOUSEHOLD_BASED';
  household_count_snapshot?: number;
  primary_supply_ratio?: number;
  initial_price: number;
  total_supply: number;
  remaining_supply: number;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export interface PlayLoan {
  loan_id: string;
  season_id: string;
  participant_id: string;
  transaction_id: string;
  property_id: string;
  principal: number;
  outstanding_principal: number;
  interest_rate: number;
  term_months: number;
  remaining_months: number;
  monthly_payment: number;
  annual_debt_service: number;
  base_interest_at_origination?: number;
  rate_spread?: number;
  status: 'ACTIVE' | 'PAID_OFF' | 'DEFAULTED';
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export type OwnershipStatus = 'ACTIVE' | 'SOLD';

export interface PlayPropertyOwnership {
  ownership_id: string;
  season_id: string;
  property_id: string;
  player_id: string;
  acquisition_type: 'PRIMARY' | 'SECONDARY';
  acquisition_price: number;
  acquired_at: FirebaseFirestore.Timestamp;
  acquisition_transaction_id: string;
  status: OwnershipStatus;
  locked_for_sale: boolean;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'FILLED' | 'CANCELLED';

export interface PlaySecondaryOrder {
  order_id: string;
  season_id: string;
  property_id: string;
  player_id: string;
  side: OrderSide;
  price: number;
  quantity: number;
  status: OrderStatus;
  matched_transaction_id?: string | null;
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export type TransactionType = 'PRIMARY_PURCHASE' | 'SECONDARY_TRADE';
export type TransactionStatusType = 'COMPLETED' | 'FAILED';

export interface PlayPropertyTransaction {
  transaction_id: string;
  season_id: string;
  property_id: string;
  transaction_type: TransactionType;
  buyer_player_id: string;
  seller_player_id?: string | null;
  price: number;
  buyer_fee: number;
  seller_fee: number;
  total_buyer_cash_change: number;
  total_seller_cash_change: number;
  status: TransactionStatusType;
  idempotency_key: string;
  created_at: FirebaseFirestore.Timestamp;
}

export type ListingStatus = 'ACTIVE' | 'LOCKED' | 'SOLD' | 'CANCELLED' | 'EXPIRED';

export interface PlaySecondaryListing {
  listing_id: string;
  season_id: string;
  property_id: string;
  seller_player_id: string;
  price: number;
  status: ListingStatus;
  created_at: FirebaseFirestore.Timestamp;
  created_simulation_period: number;
  expires_simulation_period: number;
  fee_rule_version: string;
  idempotency_key: string;
  updated_at: FirebaseFirestore.Timestamp;
}
