import { searchSongBilibili } from "../utils/search/platforms/MikufansSearch";

async function search() {
  const result = await searchSongBilibili("Bad Apple", 1);
  console.log(result);
}

search();
