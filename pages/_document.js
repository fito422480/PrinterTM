import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* This script loads the runtime environment variables */}
        <script src="/env-config.js" />
        {/* Fallback script in case the file isn't found */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.__ENV = window.__ENV || {};
            // Ensure these values are always set, either from env-config.js or here
            window.__ENV.NEXT_PUBLIC_URL_BACKEND = window.__ENV.NEXT_PUBLIC_URL_BACKEND || "${
              process.env.NEXT_PUBLIC_URL_BACKEND ||
              "http://localhost:9500/invoices"
            }";
            window.__ENV.NEXT_PUBLIC_URL_BACKEND_STATS = window.__ENV.NEXT_PUBLIC_URL_BACKEND_STATS || "${
              process.env.NEXT_PUBLIC_URL_BACKEND_STATS ||
              "http://localhost:9500/invoices/stats"
            }";
            window.__ENV.NEXT_PUBLIC_URL_BACKEND_ANALYTICS = window.__ENV.NEXT_PUBLIC_URL_BACKEND_ANALYTICS || "${
              process.env.NEXT_PUBLIC_URL_BACKEND_ANALYTICS ||
              "http://localhost:9500/invoices/analytics"
            }";
            window.__ENV.NEXT_PUBLIC_MAX_FILE_SIZE = window.__ENV.NEXT_PUBLIC_MAX_FILE_SIZE || "${
              process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "10737418240"
            }";
            console.log('Environment variables set:', window.__ENV);
          `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
