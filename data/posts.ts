import { Post } from "@/types/posts";

export const fetchPosts = async (): Promise<Post[]> => {
  try {
    const response = await fetch("http://localhost:9500/invoices", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener los datos");
    }

    const data: Post[] = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default fetchPosts;
