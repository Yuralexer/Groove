from django.db import models

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name
    

class Artist(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='artist_images/', blank=True, null=True)
    header_image = models.ImageField(upload_to='artist_headers/', blank=True, null=True)
    description = models.TextField(blank=True)
    
    tags = models.ManyToManyField(Tag, related_name='artists', blank=True)

    def __str__(self):
        return self.name
    

class Album(models.Model):
    title = models.CharField(max_length=255)
    artist = models.ForeignKey(Artist, related_name='albums', on_delete=models.CASCADE)
    cover = models.ImageField(upload_to='albums/', blank=True, null=True)
    release_date = models.DateField(blank=True, null=True)
    description = models.TextField(blank=True)

    tags = models.ManyToManyField(Tag, related_name='albums', blank=True)

    def __str__(self):
        return self.title
    

class Track(models.Model):
    title = models.CharField(max_length=255)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='tracks')
    file = models.FileField(upload_to='tracks/')
    duration = models.PositiveIntegerField(default=0, help_text="Длительность в секундах")
    order = models.PositiveIntegerField(default=1)
    tags = models.ManyToManyField(Tag, related_name='tracks', blank=True)
    plays_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.title} - {self.album.artist.name}"
