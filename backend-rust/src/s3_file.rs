use aws_sdk_s3::Client;
use bytes::Bytes;
use std::io::{self, Read, Seek, SeekFrom};
use tokio::runtime::Handle;

pub struct S3File {
    client: Client,
    bucket: String,
    key: String,
    pos: u64,
    size: Option<u64>,
}

impl S3File {
    pub fn new(client: Client, bucket: String, key: String) -> Self {
        S3File {
            client,
            bucket,
            key,
            pos: 0,
            size: None,
        }
    }
    
    async fn get_size_async(&self) -> Result<u64, anyhow::Error> {
        let resp = self.client
            .head_object()
            .bucket(&self.bucket)
            .key(&self.key)
            .send()
            .await?;
        
        Ok(resp.content_length().unwrap_or(0) as u64)
    }
    
    fn get_size_sync(&mut self) -> io::Result<u64> {
        if let Some(size) = self.size {
            return Ok(size);
        }
        
        let client = self.client.clone();
        let bucket = self.bucket.clone();
        let key = self.key.clone();
        
        let size = Handle::current()
            .block_on(async move {
                let resp = client
                    .head_object()
                    .bucket(&bucket)
                    .key(&key)
                    .send()
                    .await?;
                Ok::<u64, anyhow::Error>(resp.content_length().unwrap_or(0) as u64)
            })
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;
        
        self.size = Some(size);
        Ok(size)
    }
}

impl Read for S3File {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let size = self.get_size_sync()?;
        
        if self.pos >= size {
            return Ok(0);
        }
        
        let end = std::cmp::min(self.pos + (buf.len() as u64), size);
        let range = format!("bytes={}-{}", self.pos, end - 1);
        
        let client = self.client.clone();
        let bucket = self.bucket.clone();
        let key = self.key.clone();
        
        let data = Handle::current()
            .block_on(async move {
                let resp = client
                    .get_object()
                    .bucket(&bucket)
                    .key(&key)
                    .range(range)
                    .send()
                    .await?;
                
                let data = resp.body.collect().await?;
                Ok::<Bytes, anyhow::Error>(data.into_bytes())
            })
            .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;
        
        let bytes_read = data.len();
        buf[..bytes_read].copy_from_slice(&data);
        self.pos += bytes_read as u64;
        
        Ok(bytes_read)
    }
}

impl Seek for S3File {
    fn seek(&mut self, pos: SeekFrom) -> io::Result<u64> {
        let size = self.get_size_sync()?;
        
        self.pos = match pos {
            SeekFrom::Start(offset) => offset,
            SeekFrom::End(offset) => {
                if offset >= 0 {
                    size
                } else {
                    size.saturating_sub((-offset) as u64)
                }
            }
            SeekFrom::Current(offset) => {
                if offset >= 0 {
                    self.pos.saturating_add(offset as u64)
                } else {
                    self.pos.saturating_sub((-offset) as u64)
                }
            }
        };
        
        Ok(self.pos)
    }
}