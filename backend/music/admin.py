from django.contrib import admin
from .models import Tag, Artist, Album, Track


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}

admin.site.register(Artist)
admin.site.register(Album)
admin.site.register(Track)
