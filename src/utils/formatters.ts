
/**
 * Format duration in seconds to human readable string (Indonesian)
 * e.g. 65 -> "1 menit 5 detik" or just "1 menit" based on preference
 */
export const formatDurationHuman = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds} detik`;
    
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const days = Math.floor(totalSeconds / 86400);

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    const parts = [];
    if (weeks > 0) parts.push(`${weeks} minggu`);
    if (remainingDays > 0) parts.push(`${remainingDays} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);

    return parts.join(' ');
}; (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds} detik`;
    
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const days = Math.floor(totalSeconds / 86400);

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    const parts = [];
    if (weeks > 0) parts.push(`${weeks} minggu`);
    if (remainingDays > 0) parts.push(`${remainingDays} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);

    return parts.join(' ');
};
