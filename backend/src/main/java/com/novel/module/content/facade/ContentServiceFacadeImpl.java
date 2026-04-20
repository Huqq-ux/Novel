package com.novel.module.content.facade;

import com.novel.module.content.entity.BookEntity;
import com.novel.module.content.entity.ChapterEntity;
import com.novel.module.content.service.ContentDomainService;
import com.novel.module.spi.ContentServiceFacade;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ContentServiceFacadeImpl implements ContentServiceFacade {

    @Autowired
    private ContentDomainService contentDomainService;

    @Override
    public boolean existsBookById(Long bookId) {
        return contentDomainService.findBookById(bookId).isPresent();
    }

    @Override
    public Optional<BookInfo> getBookInfo(Long bookId) {
        return contentDomainService.findBookById(bookId).map(this::toBookInfo);
    }

    @Override
    public Optional<ChapterInfo> getChapterInfo(Long chapterId) {
        return contentDomainService.findChapterById(chapterId).map(this::toChapterInfo);
    }

    @Override
    public List<ChapterInfo> getChaptersByBookId(Long bookId) {
        return contentDomainService.findChaptersByBookId(bookId).stream()
                .map(this::toChapterInfo)
                .collect(Collectors.toList());
    }

    @Override
    public boolean isChapterFree(Long bookId, Long chapterId) {
        return contentDomainService.isChapterFree(bookId, chapterId);
    }

    @Override
    public Integer getChapterPrice(Long bookId, Long chapterId) {
        return contentDomainService.getChapterPrice(bookId, chapterId);
    }

    @Override
    public void updateBookRating(Long bookId, Double rating) {
        contentDomainService.updateBookRating(bookId, rating);
    }

    private BookInfo toBookInfo(BookEntity entity) {
        BookInfo info = new BookInfo();
        info.setId(entity.getId());
        info.setTitle(entity.getTitle());
        info.setAuthor(entity.getAuthor());
        info.setCover(entity.getCover());
        info.setCategory(entity.getCategory());
        info.setDescription(entity.getDescription());
        info.setChapterCount(entity.getChapterCount());
        info.setIsFinished(entity.getIsFinished());
        info.setRating(entity.getRating());
        info.setClickCount(entity.getClickCount());
        info.setCollectCount(entity.getCollectCount());
        info.setPriceType(entity.getPriceType());
        info.setAuthorId(entity.getAuthorId());
        info.setFreeChapterCount(entity.getFreeChapterCount());
        info.setTotalWords(entity.getTotalWords());
        return info;
    }

    private ChapterInfo toChapterInfo(ChapterEntity entity) {
        ChapterInfo info = new ChapterInfo();
        info.setId(entity.getId());
        info.setBookId(entity.getBookId());
        info.setTitle(entity.getTitle());
        info.setContent(entity.getContent());
        info.setWordCount(entity.getWordCount());
        info.setOrderNum(entity.getOrderNum());
        info.setIsFree(entity.getIsFree());
        info.setPrice(entity.getPrice());
        return info;
    }
}
