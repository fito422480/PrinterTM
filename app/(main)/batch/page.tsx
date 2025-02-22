import PostsTable from "@/components/posts/PostsTable";
import BackButton from "@/components/BackButton";
import UploadCSV from "@/components/upload/page"; // Importa el componente de carga CSV

const BatchPage = () => {
  return (
    <>
      <BackButton text="Atrás" link="/" />
      <UploadCSV /> {/* Agrega el componente aquí */}
      {/* <PostsPagination /> */}
    </>
  );
};

export default BatchPage;
