-- StudyFlow 私有图片 bucket：mistake-images（可重复执行）
-- 上传路径约定：{user_id}/{安全唯一文件名}，策略只放行本人目录。
insert into storage.buckets (id, name, public) values ('mistake-images', 'mistake-images', false)
on conflict (id) do nothing;

drop policy if exists "mistake_images_select_own" on storage.objects;
create policy "mistake_images_select_own" on storage.objects for select using (
  bucket_id = 'mistake-images' and auth.uid()::text = (storage.foldername(name))[1]
);
drop policy if exists "mistake_images_insert_own" on storage.objects;
create policy "mistake_images_insert_own" on storage.objects for insert with check (
  bucket_id = 'mistake-images' and auth.uid()::text = (storage.foldername(name))[1]
);
drop policy if exists "mistake_images_update_own" on storage.objects;
create policy "mistake_images_update_own" on storage.objects for update using (
  bucket_id = 'mistake-images' and auth.uid()::text = (storage.foldername(name))[1]
);
drop policy if exists "mistake_images_delete_own" on storage.objects;
create policy "mistake_images_delete_own" on storage.objects for delete using (
  bucket_id = 'mistake-images' and auth.uid()::text = (storage.foldername(name))[1]
);
