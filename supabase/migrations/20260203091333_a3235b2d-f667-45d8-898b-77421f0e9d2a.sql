-- 创建一个函数，允许通过邮箱将用户提升为管理员
-- 这只能在数据库中直接执行，用于初始化第一个管理员
CREATE OR REPLACE FUNCTION public.make_admin_by_email(_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID;
BEGIN
    -- 获取用户 ID
    SELECT id INTO _user_id FROM auth.users WHERE email = _email;
    
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', _email;
    END IF;
    
    -- 更新或插入管理员角色
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- 删除员工角色（如果存在）
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'employee';
END;
$$;

-- 只有超级管理员可以调用此函数
REVOKE ALL ON FUNCTION public.make_admin_by_email(TEXT) FROM PUBLIC;