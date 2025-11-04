import { render, screen, fireEvent, waitFor } from '@testing-library/svelte/svelte5';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StudentSearchModal from '../student-search-modal.svelte';

// Mock fetch
global.fetch = vi.fn();

describe('StudentSearchModal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('should render modal when open is true', () => {
		render(StudentSearchModal, {
			props: {
				open: true,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		expect(screen.getByText('Buscar Aluno')).toBeInTheDocument();
		expect(screen.getByLabelText('Nome')).toBeInTheDocument();
		expect(screen.getByLabelText('Data de Nascimento')).toBeInTheDocument();
		expect(screen.getByLabelText('CPF')).toBeInTheDocument();
	});

	it('should not render modal when open is false', () => {
		render(StudentSearchModal, {
			props: {
				open: false,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		expect(screen.queryByText('Buscar Aluno')).not.toBeInTheDocument();
	});

	it('should show validation error when searching without criteria', async () => {
		// Mock toast
		const toastMock = vi.fn();
		vi.mock('svelte-sonner', () => ({
			toast: {
				error: toastMock,
				success: vi.fn()
			}
		}));

		render(StudentSearchModal, {
			props: {
				open: true,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		const searchButton = screen.getByText('Buscar');
		await fireEvent.click(searchButton);

		await waitFor(() => {
			expect(toastMock).toHaveBeenCalledWith('Por favor, preencha pelo menos um campo para buscar');
		});
	});

	it('should search for students with valid criteria', async () => {
		const mockSearchResults = [
			{
				id: 1,
				nomeCompleto: 'João Silva',
				dataNascimento: '2010-05-15',
				cpf: '12345678901'
			}
		];

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockSearchResults
		});

		render(StudentSearchModal, {
			props: {
				open: true,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		const nameInput = screen.getByLabelText('Nome');
		await fireEvent.input(nameInput, { target: { value: 'João' } });

		const searchButton = screen.getByText('Buscar');
		await fireEvent.click(searchButton);

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith('/api/students/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					nome: 'João',
					dataNascimento: '',
					cpf: ''
				})
			});
		});

		expect(screen.getByText('João Silva')).toBeInTheDocument();
		expect(screen.getByText('Data de Nascimento: 15/05/2010')).toBeInTheDocument();
	});

	it('should handle search errors gracefully', async () => {
		// Mock toast
		const toastMock = vi.fn();
		vi.mock('svelte-sonner', () => ({
			toast: {
				error: toastMock,
				success: vi.fn()
			}
		}));

		(fetch as any).mockResolvedValueOnce({
			ok: false
		});

		render(StudentSearchModal, {
			props: {
				open: true,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		const nameInput = screen.getByLabelText('Nome');
		await fireEvent.input(nameInput, { target: { value: 'João' } });

		const searchButton = screen.getByText('Buscar');
		await fireEvent.click(searchButton);

		await waitFor(() => {
			expect(toastMock).toHaveBeenCalledWith('Erro ao buscar alunos. Tente novamente.');
		});
	});

	it('should select a student when clicked', async () => {
		const mockSearchResults = [
			{
				id: 1,
				nomeCompleto: 'João Silva',
				dataNascimento: '2010-05-15',
				cpf: '12345678901'
			},
			{
				id: 2,
				nomeCompleto: 'Maria Souza',
				dataNascimento: '2010-08-20',
				cpf: '98765432100'
			}
		];

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockSearchResults
		});

		render(StudentSearchModal, {
			props: {
				open: true,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		const nameInput = screen.getByLabelText('Nome');
		await fireEvent.input(nameInput, { target: { value: 'João' } });

		const searchButton = screen.getByText('Buscar');
		await fireEvent.click(searchButton);

		await waitFor(() => {
			expect(screen.getByText('João Silva')).toBeInTheDocument();
			expect(screen.getByText('Maria Souza')).toBeInTheDocument();
		});

		const studentButton = screen.getByText('João Silva');
		await fireEvent.click(studentButton);

		// Check if the selected student is visually highlighted
		await waitFor(() => {
			expect(studentButton).toHaveClass('border-blue-500');
		});
	});

	it('should enroll selected student', async () => {
		const mockSearchResults = [
			{
				id: 1,
				nomeCompleto: 'João Silva',
				dataNascimento: '2010-05-15',
				cpf: '12345678901'
			}
		];

		const mockEnrollmentResult = {
			success: true,
			message: 'Aluno matriculado com sucesso',
			student: {
				id: 1,
				nomeCompleto: 'João Silva',
				dataNascimento: '2010-05-15'
			}
		};

		// Mock search API
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockSearchResults
		});

		// Mock enrollment API
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockEnrollmentResult
		});

		const { component } = render(StudentSearchModal, {
			props: {
				open: true,
				escolaId: 12345,
				turma: '1A',
				periodo: 'MANHA',
				anoLetivo: 2025
			}
		});

		// Mock toast
		const toastMock = vi.fn();
		vi.mock('svelte-sonner', () => ({
			toast: {
				error: vi.fn(),
				success: toastMock
			}
		}));

		// Search for student
		const nameInput = screen.getByLabelText('Nome');
		await fireEvent.input(nameInput, { target: { value: 'João' } });

		const searchButton = screen.getByText('Buscar');
		await fireEvent.click(searchButton);

		await waitFor(() => {
			expect(screen.getByText('João Silva')).toBeInTheDocument();
		});

		// Select student
		const studentButton = screen.getByText('João Silva');
		await fireEvent.click(studentButton);

		// Enroll student
		const enrollButton = screen.getByText('Matricular');
		await fireEvent.click(enrollButton);

		await waitFor(() => {
			expect(fetch).toHaveBeenCalledWith('/api/students/enroll', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					studentId: 1,
					escolaId: 12345,
					turma: '1A',
					periodo: 'MANHA',
					anoLetivo: 2025
				})
			});
		});

		await waitFor(() => {
			expect(toastMock).toHaveBeenCalledWith('Aluno matriculado com sucesso!');
		});
	});
});