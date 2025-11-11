// Root layout for the Next.js App Router.
// - Applies global CSS
// - Sets HTML language and wraps all routes with a consistent body
"use client";
import React from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}


