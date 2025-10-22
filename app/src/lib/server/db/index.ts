/**
 * Database module - Main export point
 *
 * This module provides access to the PostgreSQL database client and types.
 */

export { sql, testConnection } from './client';
export type * from './types';
