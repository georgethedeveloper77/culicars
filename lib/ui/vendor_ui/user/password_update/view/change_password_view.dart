import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../config/ps_colors.dart';

import '../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../core/vendor/provider/user/user_provider.dart';
import '../../../../../core/vendor/repository/user_repository.dart';
import '../../../../../core/vendor/utils/utils.dart';
import '../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../custom_ui/user/password_update/component/pwd_change_button.dart';
import '../../../common/base/ps_widget_with_appbar.dart';
import '../../../common/ps_header_icon_and_dynamic_text_widget.dart';
import '../../../common/ps_textfield_widget.dart';

class ChangePasswordView extends StatefulWidget {
  @override
  _ChangePasswordViewState createState() => _ChangePasswordViewState();
}

class _ChangePasswordViewState extends State<ChangePasswordView> {
  UserRepository? userRepo;
  PsValueHolder? psValueHolder;
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  @override
  Widget build(BuildContext context) {
    userRepo = Provider.of<UserRepository>(context);
    psValueHolder = Provider.of<PsValueHolder>(context);

    return PsWidgetWithAppBar<UserProvider>(
        appBarTitle: 'change_password__title'.tr,
        initProvider: () {
          return UserProvider(repo: userRepo, psValueHolder: psValueHolder);
        },
        onProviderReady: (UserProvider provider) {
          return provider;
        },
        builder: (BuildContext context, UserProvider provider, Widget? child) {
          return SingleChildScrollView(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  PsHeaderIconAndDynamicTextWidget(
                    text: 'forgot_psw__update_password_title'.tr,
                  ),
                  PsTextFieldPasswordWidget(
                      height: 40,
                      titleText: 'change_password__password'.tr,
                      textAboutMe: false,
                      hintText: 'Enter Password',
                      textEditingController: passwordController),
                  Padding(
                    padding: const EdgeInsets.only(
                      left: PsDimens.space16,
                      right: PsDimens.space16,
                    ),
                    child: Text(
                      'Your password must be at least 6 characters'.tr,
                      style: Theme.of(context).textTheme.bodySmall!.copyWith(
                          color: Utils.isLightMode(context)
                              ? PsColors.text300
                              : PsColors.achromatic50),
                    ),
                  ),
                  const SizedBox(
                    height: PsDimens.space8,
                  ),
                  PsTextFieldPasswordWidget(
                      height: 40,
                      titleText: 'change_password__confirm_password'.tr,
                      textAboutMe: false,
                      hintText: 'Enter Password',
                      textEditingController: confirmPasswordController),
                  Padding(
                    padding: const EdgeInsets.only(
                        left: PsDimens.space16, right: PsDimens.space16),
                    child: Text(
                      'Your password must be at least 6 characters'.tr,
                      style: Theme.of(context).textTheme.bodySmall!.copyWith(
                          color: Utils.isLightMode(context)
                              ? PsColors.text300
                              : PsColors.achromatic50),
                    ),
                  ),
                  CustomPwdChangeSaveButton(
                    passwordController: passwordController,
                    confirmPasswordController: confirmPasswordController,
                  ),
                ]),
          );
        });
  }
}
