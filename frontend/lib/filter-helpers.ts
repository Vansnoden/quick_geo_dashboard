import { FilterCondition } from '@/lib/definitions';


export function filterValuesToConditions(filters: Record<string, any>): FilterCondition[] {
    const conditions: FilterCondition[] = [];
    const processedColumns = new Set<string>();

    for (const [key, val] of Object.entries(filters)) {
        if (val === '' || val === undefined || val === null) continue;

        if (key.endsWith('_min')) {
            const column = key.slice(0, -4);
            const maxKey = `${column}_max`;
            const maxVal = filters[maxKey];
            if (maxVal !== undefined && maxVal !== '' && maxVal !== null) {
                conditions.push({
                    column,
                    operator: 'between',
                    value: [Number(val), Number(maxVal)]
                });
                processedColumns.add(column);
            } else {
                conditions.push({ column, operator: '>=', value: Number(val) });
                processedColumns.add(column);
            }
        } else if (key.endsWith('_max')) {
            const column = key.slice(0, -4);
            if (!processedColumns.has(column)) {
                conditions.push({ column, operator: '<=', value: Number(val) });
                processedColumns.add(column);
            }
        } else {
            if (Array.isArray(val) && val.length > 0) {
                conditions.push({ column: key, operator: 'in', value: val });
            } else if (typeof val === 'object' && val !== null) {
                if ('min' in val && val.min !== undefined) {
                    conditions.push({ column: key, operator: '>=', value: Number(val.min) });
                }
                if ('max' in val && val.max !== undefined) {
                    conditions.push({ column: key, operator: '<=', value: Number(val.max) });
                }
            } else if (val !== '') {
                conditions.push({ column: key, operator: '=', value: String(val) });
            }
        }
    }

    return conditions;
}
