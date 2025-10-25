import type { PageServerLoad } from './$types';
import { getSchoolsByUsf } from '$lib/server/db/queries/schools';

export const load: PageServerLoad = async ({ parent }) => {
	const { session } = await parent();

	// Extract usf_id from session user data
	const usf_id = (session?.user as any)?.usf_id;

	// Fetch schools for the user's USF
	const schools = usf_id ? await getSchoolsByUsf(usf_id) : [];

	return {
		schools
	};
};
