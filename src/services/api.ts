import axios from 'axios'
import { API_CONFIG } from '../constants/api'

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.status, error.message)
    return Promise.reject(error)
  }
)

// Types
export type WPPost = {
  id: number
  link: string
  date?: string
  title: { rendered: string }
  excerpt?: { rendered: string }
  content?: { rendered: string }
  categories?: number[]
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>
    'wp:term'?: Array<Array<{ taxonomy: string; name: string }>>
  }
}

export type WPCategory = {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  parent: number
  meta: any[]
  _links: any
}

export type PostsQueryParams = {
  _embed?: boolean
  per_page?: number
  categories?: number
  search?: string
  [key: string]: any
}

// API Functions
export const postsApi = {
  // Get all posts with default params
  getPosts: async (params?: PostsQueryParams): Promise<WPPost[]> => {
    const defaultParams = {
      _embed: true,
      per_page: 10,
      ...params,
    }

    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: defaultParams,
    })

    return response.data
  },

  // Get single post by ID
  getSinglePost: async (id: number): Promise<WPPost> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}/${id}`, {
      params: { _embed: 1 },
    })

    return response.data
  },

  // Get posts by category
  getPostsByCategory: async (categoryId: number, params?: PostsQueryParams): Promise<WPPost[]> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: {
        _embed: true,
        per_page: 10,
        categories: categoryId, // WordPress expects category ID (integer)
        ...params,
      },
    })

    return response.data
  },

  // Search posts
  searchPosts: async (query: string, params?: PostsQueryParams): Promise<WPPost[]> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.POSTS_ENDPOINT}`, {
      params: {
        _embed: true,
        per_page: 10,
        search: query,
        ...params,
      },
    })

    return response.data
  },
}

// Categories API
export const categoriesApi = {
  // Get all categories
  getCategories: async (params?: { per_page?: number; hide_empty?: boolean }): Promise<WPCategory[]> => {
    const defaultParams = {
      per_page: 10, // Get all categories
      hide_empty: true, // Only show categories with posts
      ...params,
    }

    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.CATEGORIES_ENDPOINT}`, {
      params: defaultParams,
    })

    return response.data
  },

  // Get single category by ID
  getCategory: async (id: number): Promise<WPCategory> => {
    const response = await apiClient.get(`${API_CONFIG.WP_JSON_BASE}${API_CONFIG.CATEGORIES_ENDPOINT}/${id}`)
    return response.data
  },
}