import { Link } from "react-router-dom";
import { PageContainer } from "@/components/common/PageContainer";
import { Button } from "@/components/ui/button";
import { paths } from "@/routes/paths";

const NotFoundPage = () => (
  <PageContainer className="flex items-center justify-center">
    <div className="text-center">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <p className="mb-6 text-xl text-muted-foreground">Page not found</p>
      <Button asChild>
        <Link to={paths.home}>Return to Home</Link>
      </Button>
    </div>
  </PageContainer>
);

export default NotFoundPage;
