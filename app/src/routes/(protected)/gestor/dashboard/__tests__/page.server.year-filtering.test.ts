import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from '../+page.server';
import { error } from '@sveltejs/kit';

// Mock the database queries
vi.mock('$lib/server/db/queries/dashboard', () => ({
	getAnthropometricStats: vi.fn(),
	getVisualAcuityStats: vi.fn(),
	getDentalRiskStats: vi.fn(),
	getEvaluationCoverageStats: vi.fn()
}));

describe('Dashboard Year Filtering', () => {
	let mockLocals: any;
	let mockDashboardQueries: any;
	const currentYear = new Date().getFullYear();

	beforeEach(() => {
		vi.clearAllMocks();

		mockLocals = {
			auth: vi.fn()
		};

		// Mock authenticated manager
		mockLocals.auth.mockResolvedValue({
			user: { id: 1, email: 'manager@test.com', is_gestor: true }
		});
	});

	describe('Year Parameter Handling', () => {
		it('should use current year when no year parameter is provided', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(null) } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(null);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(mockUrl.searchParams.get).toHaveBeenCalledWith('ano');
			expect(mockDashboardQueries.getAnthropometricStats).toHaveBeenCalledWith(currentYear);
			expect(mockDashboardQueries.getVisualAcuityStats).toHaveBeenCalledWith(currentYear);
			expect(mockDashboardQueries.getDentalRiskStats).toHaveBeenCalledWith(currentYear);
			expect(mockDashboardQueries.getEvaluationCoverageStats).toHaveBeenCalledWith(currentYear);
			expect(result.currentYear).toBe(currentYear);
		});

		it('should use provided year parameter when valid', async () => {
			const year2024 = 2024;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('2024') } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(null);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(mockDashboardQueries.getAnthropometricStats).toHaveBeenCalledWith(year2024);
			expect(mockDashboardQueries.getVisualAcuityStats).toHaveBeenCalledWith(year2024);
			expect(mockDashboardQueries.getDentalRiskStats).toHaveBeenCalledWith(year2024);
			expect(mockDashboardQueries.getEvaluationCoverageStats).toHaveBeenCalledWith(year2024);
			expect(result.currentYear).toBe(year2024);
		});

		it('should handle historical year data (2023)', async () => {
			const year2023 = 2023;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('2023') } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			// Mock historical data
			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([
				{ classificacao: 'Peso adequado', count: 80, percentage: 80 },
				{ classificacao: 'Sobrepeso', count: 20, percentage: 20 }
			]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([
				{ acuity_range: '>= 1.0', olho_direito: 60, olho_esquerdo: 58 },
				{ acuity_range: '0.61-0.9', olho_direito: 30, olho_esquerdo: 32 },
				{ acuity_range: '<= 0.6', olho_direito: 10, olho_esquerdo: 10 }
			]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([
				{ risco: 'A', count: 30, percentage: 30 },
				{ risco: 'B', count: 40, percentage: 40 },
				{ risco: 'C', count: 30, percentage: 30 }
			]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue({
				total_students: 100,
				anthropometric_completed: 95,
				visual_completed: 90,
				dental_completed: 85,
				anthropometric_percentage: 95,
				visual_percentage: 90,
				dental_percentage: 85
			});

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(result.currentYear).toBe(year2023);
			expect(result.anthropometricStats).toHaveLength(2);
			expect(result.visualAcuityStats).toHaveLength(3);
			expect(result.dentalRiskStats).toHaveLength(3);
			expect(result.coverageStats.total_students).toBe(100);
		});

		it('should handle year 2024 data correctly', async () => {
			const year2024 = 2024;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('2024') } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			// Mock 2024 data
			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([
				{ classificacao: 'Peso adequado', count: 85, percentage: 85 },
				{ classificacao: 'Sobrepeso', count: 15, percentage: 15 }
			]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([
				{ acuity_range: '>= 1.0', olho_direito: 65, olho_esquerdo: 63 },
				{ acuity_range: '0.61-0.9', olho_direito: 28, olho_esquerdo: 30 },
				{ acuity_range: '<= 0.6', olho_direito: 7, olho_esquerdo: 7 }
			]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([
				{ risco: 'A', count: 35, percentage: 35 },
				{ risco: 'B', count: 45, percentage: 45 },
				{ risco: 'C', count: 20, percentage: 20 }
			]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue({
				total_students: 105,
				anthropometric_completed: 100,
				visual_completed: 95,
				dental_completed: 90,
				anthropometric_percentage: 95.2,
				visual_percentage: 90.5,
				dental_percentage: 85.7
			});

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(result.currentYear).toBe(year2024);
			expect(result.anthropometricStats[0].count).toBe(85);
			expect(result.coverageStats.total_students).toBe(105);
		});
	});

	describe('Year Validation', () => {
		it('should reject non-numeric year parameter', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('invalid') } };

			await expect(load({ locals: mockLocals, url: mockUrl } as any)).rejects.toMatchObject({
				status: 400,
				body: { message: 'Ano inválido' }
			});
		});

		it('should reject year that is too old (more than 10 years ago)', async () => {
			const tooOldYear = currentYear - 11;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(tooOldYear.toString()) } };

			await expect(load({ locals: mockLocals, url: mockUrl } as any)).rejects.toMatchObject({
				status: 400,
				body: { message: 'Ano inválido' }
			});
		});

		it('should reject year that is too far in the future', async () => {
			const futureYear = currentYear + 2;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(futureYear.toString()) } };

			await expect(load({ locals: mockLocals, url: mockUrl } as any)).rejects.toMatchObject({
				status: 400,
				body: { message: 'Ano inválido' }
			});
		});

		it('accept year exactly 10 years ago', async () => {
			const tenYearsAgo = currentYear - 10;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(tenYearsAgo.toString()) } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(null);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(result.currentYear).toBe(tenYearsAgo);
		});

		it('accept next year', async () => {
			const nextYear = currentYear + 1;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(nextYear.toString()) } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(null);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(result.currentYear).toBe(nextYear);
		});
	});

	describe('Available Years Generation', () => {
		it('should generate correct range of available years', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(null) } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(null);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(result.availableYears).toBeInstanceOf(Array);
			expect(result.availableYears).toHaveLength(11); // Current year to 10 years ago
			expect(result.availableYears[0]).toBe(currentYear);
			expect(result.availableYears[10]).toBe(currentYear - 10);
			expect(result.availableYears).toEqual(
				Array.from({ length: 11 }, (_, i) => currentYear - i)
			);
		});

		it('should include historical years (2023, 2024) in available years', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(null) } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(null);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			// Assuming current year is 2025, these should be included
			expect(result.availableYears).toContain(2025);
			expect(result.availableYears).toContain(2024);
			expect(result.availableYears).toContain(2023);
		});
	});

	describe('Data Fetching with Year Filter', () => {
		it('should fetch all dashboard metrics with correct year parameter', async () => {
			const testYear = 2024;
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue(testYear.toString()) } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			const mockAnthropometricData = [
				{ classificacao: 'Peso adequado', count: 100, percentage: 80 },
				{ classificacao: 'Sobrepeso', count: 25, percentage: 20 }
			];
			const mockVisualData = [
				{ acuity_range: '>= 1.0', olho_direito: 80, olho_esquerdo: 75 },
				{ acuity_range: '0.61-0.9', olho_direito: 35, olho_esquerdo: 40 },
				{ acuity_range: '<= 0.6', olho_direito: 10, olho_esquerdo: 10 }
			];
			const mockDentalData = [
				{ risco: 'A', count: 40, percentage: 32 },
				{ risco: 'B', count: 50, percentage: 40 },
				{ risco: 'C', count: 35, percentage: 28 }
			];
			const mockCoverageData = {
				total_students: 125,
				anthropometric_completed: 120,
				visual_completed: 115,
				dental_completed: 110,
				anthropometric_percentage: 96,
				visual_percentage: 92,
				dental_percentage: 88
			};

			mockDashboardQueries.getAnthropometricStats.mockResolvedValue(mockAnthropometricData);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue(mockVisualData);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue(mockDentalData);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue(mockCoverageData);

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(mockDashboardQueries.getAnthropometricStats).toHaveBeenCalledWith(testYear);
			expect(mockDashboardQueries.getVisualAcuityStats).toHaveBeenCalledWith(testYear);
			expect(mockDashboardQueries.getDentalRiskStats).toHaveBeenCalledWith(testYear);
			expect(mockDashboardQueries.getEvaluationCoverageStats).toHaveBeenCalledWith(testYear);

			expect(result.anthropometricStats).toEqual(mockAnthropometricData);
			expect(result.visualAcuityStats).toEqual(mockVisualData);
			expect(result.dentalRiskStats).toEqual(mockDentalData);
			expect(result.coverageStats).toEqual(mockCoverageData);
			expect(result.currentYear).toBe(testYear);
		});

		it('should handle parallel data fetching correctly', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('2024') } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			// Track execution order
			const callOrder: string[] = [];

			mockDashboardQueries.getAnthropometricStats.mockImplementation(async () => {
				callOrder.push('anthropometric');
				return [];
			});
			mockDashboardQueries.getVisualAcuityStats.mockImplementation(async () => {
				callOrder.push('visual');
				return [];
			});
			mockDashboardQueries.getDentalRiskStats.mockImplementation(async () => {
				callOrder.push('dental');
				return [];
			});
			mockDashboardQueries.getEvaluationCoverageStats.mockImplementation(async () => {
				callOrder.push('coverage');
				return null;
			});

			await load({ locals: mockLocals, url: mockUrl } as any);

			// All functions should be called (order doesn't matter due to Promise.all)
			expect(callOrder).toHaveLength(4);
			expect(callOrder).toContain('anthropometric');
			expect(callOrder).toContain('visual');
			expect(callOrder).toContain('dental');
			expect(callOrder).toContain('coverage');
		});
	});

	describe('Error Handling with Year Filter', () => {
		it('should handle database errors for specific year gracefully', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('2023') } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			mockDashboardQueries.getAnthropometricStats.mockReset();
			mockDashboardQueries.getAnthropometricStats.mockRejectedValue(new Error('Database connection failed'));

			await expect(load({ locals: mockLocals, url: mockUrl } as any)).rejects.toMatchObject({
				status: 500,
				body: { message: 'Erro ao carregar dados do dashboard' }
			});
		});

		it('should handle missing data for historical years', async () => {
			const mockUrl = { searchParams: { get: vi.fn().mockReturnValue('2020') } };
			const mockDashboardQueries = await import('$lib/server/db/queries/dashboard');

			// Mock empty data for old year
			mockDashboardQueries.getAnthropometricStats.mockResolvedValue([]);
			mockDashboardQueries.getVisualAcuityStats.mockResolvedValue([]);
			mockDashboardQueries.getDentalRiskStats.mockResolvedValue([]);
			mockDashboardQueries.getEvaluationCoverageStats.mockResolvedValue({
				total_students: 0,
				anthropometric_completed: 0,
				visual_completed: 0,
				dental_completed: 0,
				anthropometric_percentage: 0,
				visual_percentage: 0,
				dental_percentage: 0
			});

			const result = await load({ locals: mockLocals, url: mockUrl } as any);

			expect(result.currentYear).toBe(2020);
			expect(result.anthropometricStats).toEqual([]);
			expect(result.visualAcuityStats).toEqual([]);
			expect(result.dentalRiskStats).toEqual([]);
			expect(result.coverageStats.total_students).toBe(0);
		});
	});
});