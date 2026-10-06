import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>1/1 Agent</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
