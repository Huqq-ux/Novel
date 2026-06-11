package com.novel.interaction.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.novel.common.entity.Tip;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface TipMapper extends BaseMapper<Tip> {

    List<Tip> selectByBookId(@Param("bookId") Long bookId);

    List<Tip> selectByAuthorId(@Param("authorId") Long authorId);
}
