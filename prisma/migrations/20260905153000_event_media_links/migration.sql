-- CreateEnum
CREATE TYPE "MediaLinkKind" AS ENUM ('youtube', 'instagram', 'drive', 'other');

-- CreateTable
CREATE TABLE "media_links" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "category_id" UUID,
    "battle_id" UUID,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" "MediaLinkKind" NOT NULL DEFAULT 'other',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_links_event_sort_idx" ON "media_links"("event_id", "sort_order");

-- CreateIndex
CREATE INDEX "media_links_category_id_idx" ON "media_links"("category_id");

-- AddForeignKey
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
