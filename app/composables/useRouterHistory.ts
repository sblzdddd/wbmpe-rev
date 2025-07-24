

export const useRouterHistory = () => {
  const lastPath = useState('lastPath', () => '')

  const setLastPath = (path: string) => {
    lastPath.value = path
  }

  return {
    lastPath,
    setLastPath
  }
}
