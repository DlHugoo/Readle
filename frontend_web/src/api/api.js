import axios from "axios";

export const fetchBooks = async () => {
  const res = await axios.get(`/api/books`);
  return res.data;
};
