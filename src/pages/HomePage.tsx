import { PageContainer } from "@/components/common/PageContainer";
import { env } from "@/config/env";

const HomePage = () => (
  <PageContainer className="flex items-center justify-center">
    <div className="text-center">
      <h1 className="mb-4 text-4xl font-bold">{env.appName}</h1>
      <p className="text-xl text-muted-foreground">Hospitality Management and Online Booking</p>
    </div>
  </PageContainer>
);

export default HomePage;
