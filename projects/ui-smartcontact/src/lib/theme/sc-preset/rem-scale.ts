const DESIGN_REM_BASE_PX = 14;
const BROWSER_REM_BASE_PX = 16;
const REM_SCALE = DESIGN_REM_BASE_PX / BROWSER_REM_BASE_PX;
const REM_VALUE_PATTERN = /(-?\d*\.?\d+)rem\b/g;

const formatRem = (value: number) => {
    const rounded = Number(value.toFixed(6));

    return rounded === 0 ? "0" : `${rounded}rem`;
};

export const fromDesignRem = (value: number) => formatRem(value * REM_SCALE);

export const fromDesignPx = (value: number) => formatRem(value / BROWSER_REM_BASE_PX);

const normalizeString = (value: string) =>
    value.replace(REM_VALUE_PATTERN, (_, amount: string) => fromDesignRem(Number(amount)));

export const normalizeDesignRem = <T>(value: T): T => {
    if (typeof value === "string") {
        return normalizeString(value) as T;
    }

    if (Array.isArray(value)) {
        return value.map((item) => normalizeDesignRem(item)) as T;
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeDesignRem(item)])
        ) as T;
    }

    return value;
};
