import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

/**
 * AniList GraphQL istek atma yardımcı fonksiyonu
 */
async function anilistQuery(query, variables) {
  const res = await axios.post(ANILIST_URL, { query, variables });
  return res.data.data;
}

/**
 * AniList status değerlerini GoGoAnime formatına uyarlama
 */
function formatStatus(status) {
  switch (status) {
    case 'FINISHED': return 'Completed';
    case 'RELEASING': return 'Ongoing';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    default: return status;
  }
}

/**
 * Anime arama
 */
export const scrapeSearch = async ({ list = [], keyw, page = 1 }) => {
  const query = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(search: $search, type: ANIME) {
          id
          title { romaji english native }
          coverImage { large }
          status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { search: keyw, page });
  const results = data.Page.media.map(a => ({
    anime_id: a.id,
    name: a.title.english || a.title.romaji,
    img_url: a.coverImage.large,
    status: formatStatus(a.status),
  }));
  return list.concat(results);
};

/**
 * Popüler anime listesi
 */
export const scrapePopularAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large }
          status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  const results = data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  }));
  return list.concat(results);
};

/**
 * Yeni sezon (yıl & sezon bilgisine göre)
 */
export const scrapeNewSeason = async ({ list = [], season, year, page = 1 }) => {
  const query = `
    query ($page: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: 20) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large }
          status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, season, seasonYear: year });
  const results = data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  }));
  return list.concat(results);
};

/**
 * Türlere göre arama
 */
export const scrapeGenre = async ({ list = [], genre, page = 1 }) => {
  const query = `
    query ($page: Int, $genre: String) {
      Page(page: $page, perPage: 20) {
        media(genre_in: [$genre], type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large }
          status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, genre });
  const results = data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    animeImg: a.coverImage.large,
    releasedDate: '', // AniList'te yıl bilgisi var, istenirse eklenebilir
    animeUrl: `https://anilist.co/anime/${a.id}`,
  }));
  return list.concat(results);
};

/**
 * Detay sayfası
 */
export const scrapeAnimeDetails = async ({ id }) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english native }
        description(asHtml: false)
        episodes
        coverImage { large }
        genres
        status
        startDate { year month day }
        format
        synonyms
      }
    }
  `;
  const data = await anilistQuery(query, { id: parseInt(id) });
  const a = data.Media;
  return {
    name: a.title.english || a.title.romaji,
    type: a.format,
    released: a.startDate.year,
    status: formatStatus(a.status),
    genres: a.genres,
    othername: a.synonyms.join(', '),
    synopsis: a.description,
    imageUrl: a.coverImage.large,
    totalEpisodes: a.episodes || 'Unknown',
    episode_id: [], // AniList API tek tek link vermez
    episode_info_html: '',
    episode_page: '',
  };
};

/**
 * Tamamlanmış anime listesi
 */
export const scrapeCompletedAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(status: FINISHED, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large }
          status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  const results = data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  }));
  return list.concat(results);
};

/**
 * Yayında olan anime listesi
 */
export const scrapeOngoingAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large }
          status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  const results = data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  }));
  return list.concat(results);
};

/**
 * En çok izlenen / popüler devam edenler
 */
export const scrapeTopAiringAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          coverImage { large }
          status
          genres
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  const results = data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    animeImg: a.coverImage.large,
    latestEp: '', // AniList bölüm numarası vermez
    animeUrl: `https://anilist.co/anime/${a.id}`,
    genres: a.genres,
  }));
  return list.concat(results);
};
