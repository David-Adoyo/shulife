import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Mark } from "@/components/brand";
import { Button, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main">
        <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
          <Mark className="h-16 w-auto" />
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-gold-700">Page not found</p>
          <h1 className="mt-3 font-display text-5xl text-navy-900 sm:text-6xl">This page has gone home early.</h1>
          <p className="mt-5 max-w-md text-lg text-ink-600">The page you’re looking for doesn’t exist or has moved.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button href="/" arrow>
              Back to home
            </Button>
            <Button href="/help/" variant="outline">
              Help centre
            </Button>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
