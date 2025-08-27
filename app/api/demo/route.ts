import { NextRequest, NextResponse } from "next/server";
import { quickCrawl } from "@/lib/quick-crawl";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Perform quick crawl of the website
    const crawlResult = await quickCrawl(url);

    // Return demo configuration with crawled data
    return NextResponse.json({
      demoId: crawlResult.demoId,
      widgetUrl: `/demo/${crawlResult.demoId}`,
      config: {
        url,
        brandName: crawlResult.config.brandName,
        brandColor: crawlResult.config.brandColor,
        position: "bottom-right",
        welcomeMessage: crawlResult.config.welcomeMessage,
        headerTitle: crawlResult.config.brandName + " Support",
        headerSubtitle: "We're here to help!",
        features: {
          scraping: true,
          woocommerce: false,
        },
      },
      content: {
        title: crawlResult.content.title,
        description: crawlResult.content.description,
      },
      expiresIn: 3600, // 1 hour
    });
  } catch (error) {
    console.error("Demo generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate demo. Please try again." },
      { status: 500 }
    );
  }
}