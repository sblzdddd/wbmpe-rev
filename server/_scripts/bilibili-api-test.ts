import { search_by_type } from "bilibili-api-ts/search";



(async function(){
  console.log(JSON.stringify(await search_by_type({keyword: "Bad Apple", search_type: "video", page: 1})));
})();
