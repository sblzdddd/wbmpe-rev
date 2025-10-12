// Image proxy utilities for handling CORS domains and providers
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

export function useImageProxy(src: MaybeRefOrGetter<string>) {
  // Domains that require CORS proxy
  const corsProxyDomains = [
    'i1.hdslb.com',
    'i0.hdslb.com',
    'i2.hdslb.com',
    'i3.hdslb.com'
  ]

  // Netease music domains
  const neteaseDomains = [
    'p1.music.126.net',
    'p2.music.126.net', 
    'p3.music.126.net',
    'p4.music.126.net'
  ]

  const needsProxy = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url)
      return corsProxyDomains.includes(parsedUrl.hostname)
    } catch {
      return false
    }
  }

  const isNetease = (url: string): boolean => {
    try {
      const parsedUrl = new URL(url)
      return neteaseDomains.includes(parsedUrl.hostname)
    } catch {
      return false
    }
  }

  const processedSrc = computed(() => {
    let processedUrl = toValue(src) ?? ''
    
    // Handle cdn:// prefix first
    if (processedUrl.startsWith('cdn://')) {
      processedUrl = processedUrl.replace('cdn://', '/')
    }
    
    // Handle protocol-relative URLs
    if (processedUrl.startsWith('//')) {
      processedUrl = 'https:' + processedUrl
    }
    
    // Check if the URL needs proxy for CORS
    if (needsProxy(processedUrl)) {
      return `${encodeURIComponent(processedUrl)}`
    }
    
    return processedUrl
  })

  const provider = computed(() => {
    let urlToCheck = toValue(src) ?? ''
    
    // Handle protocol-relative URLs for provider check
    if (urlToCheck.startsWith('//')) {
      urlToCheck = 'https:' + urlToCheck
    }
    
    // If using proxy, use proxy provider
    if (needsProxy(urlToCheck)) {
      return 'proxy'
    }
    
    // If using Netease domain, use netease provider
    if (isNetease(urlToCheck)) {
      return 'netease'
    }
    
    // Original logic for cdn:// sources
    if ((toValue(src) ?? '').startsWith('cdn://')) {
      return 'aliyun'
    }
    
    return 'ipx'
  })

  return {
    processedSrc,
    provider,
    needsProxy,
    isNetease
  }
}