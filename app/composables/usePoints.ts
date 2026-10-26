import type { PointBalance } from '../../shared/schemas/api/points.schema';

/**
 * The signed-in member's point balance, shared by the app bar and the screens that spend points.
 * `null` means unknown (signed out, or not loaded yet).
 */
export const usePoints = () => {
    const balance = useState<number | null>('pointBalance', () => null);
    const { get } = useApi();

    const refresh = async (): Promise<void> => {
        try {
            balance.value = (await get<PointBalance>('/api/points')).availableBalance;
        } catch (error) {
            console.error('[usePoints] failed to load the balance:', error);
            balance.value = null;
        }
    };

    const clear = () => {
        balance.value = null;
    };

    return {
        balance: computed(() => balance.value),
        refresh,
        clear,
    };
};
