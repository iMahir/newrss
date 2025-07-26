export const convertToSlug = (feedUrl: string): string => {
    const b64 = btoa(feedUrl);
    const slug = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '');

    if (slug.length > 200) {
        return slug.slice(0, 200); // Limit slug length to 200 characters
    }
    return slug;
};
