import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { How } from "@/components/How";
import { Nav } from "@/components/Nav";
import { Playground } from "@/components/Playground";
import { Preloader } from "@/components/Preloader";

export default function Page() {
  return (
    <>
      <Preloader />
      <Nav />
      <main>
        <Hero />
        <Playground />
        <How />
      </main>
      <Footer />
    </>
  );
}
