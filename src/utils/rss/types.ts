export interface PreRssJson {
    title: string;
    link: string;
    feedUrl: string;
    items: {
        title: string;
        link: string;
        author: string | null;
        content: string | null;
        thumbnail: string | null;
        pubDate: string;
    }[];
}

export interface PostRssJson {
    title: string;
    link: string;
    feedUrl: string;
    items: {
        title: string;
        link: string;
        author: string | null;
        thumbnail: string | null;
        summary: string | null;
        keywords: string[];
        scores: {
            scale: number;
            impact: number;
            novelty: number;
            longTermSignificance: number;
        } | null;
        pubDate: string;
    }[];
}