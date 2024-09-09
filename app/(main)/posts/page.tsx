import PostsTable from "@/components/posts/PostsTable";
import BackButton from "@/components/BackButton";
import PostsPagination from "@/components/posts/PostsPagination";

const PostsPage = () => {
  // Valores de ejemplo para limit y title
  const title = "Listado de Facturas";

  return (
    <>
      <BackButton text="Atrás" link="/" />
      <h1>{title}</h1> {/* Puedes mostrar el título aquí */}
      <PostsTable />
      <PostsPagination />
    </>
  );
};

export default PostsPage;
