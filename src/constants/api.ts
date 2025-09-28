// API Configuration Constants
export const API_CONFIG = {
  BASE_URL: 'https://sozo.treonstudio.com',
  WP_JSON_BASE: '/wp-json/wp/v2',
  POSTS_ENDPOINT: '/posts',
  CATEGORIES_ENDPOINT: '/categories',
  DEFAULT_PARAMS: {
    _embed: true,
    per_page: 12
  }
} as const

// Constructed URLs
export const API_URLS = {
  POSTS: `${API_CONFIG.BASE_URL}${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`,
  CATEGORIES: `${API_CONFIG.BASE_URL}${API_CONFIG.WP_JSON_BASE}${API_CONFIG.CATEGORIES_ENDPOINT}`,
  POSTS_WITH_EMBED: `${API_CONFIG.BASE_URL}${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}?_embed&per_page=${API_CONFIG.DEFAULT_PARAMS.per_page}`,

  // Helper function for single post
  getSinglePost: (id: number) => `${API_CONFIG.BASE_URL}${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}/${id}?_embed=1`,

  // Helper function for custom query
  getPostsWithQuery: (params: Record<string, string | number>) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    return `${API_URLS.POSTS}?${searchParams.toString()}`
  }
} as const