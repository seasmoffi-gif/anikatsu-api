import axios from 'axios';

const ANILIST_URL = 'https://graphql.anilist.co';

// AniList GraphQL isteği
async function anilistQuery(query, variables) {
  const res = await axios.post(ANILIST_URL, { query, variables });
  return res.data.data;
}

// Durum formatlama
function formatStatus(status) {
  switch (status) {
    case 'FINISHED': return 'Completed';
    case 'RELEASING': return 'Ongoing';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    default: return status;
  }
}

// Anime arama
export const scrapeSearch = async ({ list = [], keyw, page = 1 }) => {
  const query = `
    query ($search: String, $page: Int) {
      Page(page: $page, perPage: 20) {
        media(search: $search, type: ANIME) {
          id title { romaji english } coverImage { large } status
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

// Popüler anime
export const scrapePopularAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large } status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  })));
};

// Yeni sezon
export const scrapeNewSeason = async ({ list = [], season, year, page = 1 }) => {
  const query = `
    query ($page: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: 20) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large } status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, season, seasonYear: year });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  })));
};

// Türlere göre arama
export const scrapeGenre = async ({ list = [], genre, page = 1 }) => {
  const query = `
    query ($page: Int, $genre: String) {
      Page(page: $page, perPage: 20) {
        media(genre_in: [$genre], type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large } status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page, genre });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    animeImg: a.coverImage.large,
    releasedDate: '',
    animeUrl: `https://anilist.co/anime/${a.id}`,
  })));
};

// Anime detay
export const scrapeAnimeDetails = async ({ id }) => {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id title { romaji english native }
        description(asHtml: false)
        episodes coverImage { large } genres status
        startDate { year } format synonyms
      }
    }
  `;
  const a = (await anilistQuery(query, { id: parseInt(id) })).Media;
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
    episode_id: [],
    episode_info_html: '',
    episode_page: '',
  };
};

// Tamamlanmış anime
export const scrapeCompletedAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(status: FINISHED, type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large } status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  })));
};

// Ongoing anime
export const scrapeOngoingAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large } status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  })));
};

// Top airing
export const scrapeTopAiringAnime = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large } genres
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    animeTitle: a.title.english || a.title.romaji,
    animeImg: a.coverImage.large,
    latestEp: '',
    animeUrl: `https://anilist.co/anime/${a.id}`,
    genres: a.genres,
  })));
};

// Movie listesi
export const scrapeAnimeMovies = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(format: MOVIE, type: ANIME, sort: POPULARITY_DESC) {
          id title { romaji english } coverImage { large }
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    title: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
  })));
};

// Son eklenenler
export const scrapeRecentlyAdded = async ({ list = [], page = 1 }) => {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 20) {
        media(type: ANIME, sort: ID_DESC) {
          id title { romaji english } coverImage { large } status
        }
      }
    }
  `;
  const data = await anilistQuery(query, { page });
  return list.concat(data.Page.media.map(a => ({
    animeId: a.id,
    title: a.title.english || a.title.romaji,
    imgUrl: a.coverImage.large,
    status: formatStatus(a.status),
  })));
};

// AZ listesi (tek harf filtre)
export const scrapeAnimeAZ = async ({ letter, page = 1 }) => {
  return scrapeSearch({ keyw: letter, page });
};

// watchAnime (sadece info döner)
export const scrapeWatchAnime = async ({ id }) => {
  return scrapeAnimeDetails({ id });
};

// Thread (forum konuları) - AniList'in forum API'si var, burada temel yapı:
export const scrapeThread = async ({ id }) => {
  const url = `https://anilist.co/forum/thread/${id}`;
  return { threadUrl: url };
};
