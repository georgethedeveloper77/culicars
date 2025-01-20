import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../../../../config/ps_colors.dart';

import '../../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../../core/vendor/provider/about_us/about_us_provider.dart';
import '../../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../../core/vendor/utils/utils.dart';
import '../../../../common/ps_bottom_sheet.dart';
import '../../../../common/ps_html_text_widget.dart';

class SafetyTipsTileView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<AboutUsProvider>(builder: (BuildContext context,
        AboutUsProvider aboutUsProvider, Widget? gchild) {
      print('aboutus:::::${aboutUsProvider.hasData}');
      return SliverToBoxAdapter(
          child: aboutUsProvider.hasData &&
                  aboutUsProvider.aboutUs.data?.safetyTips != ''
              ? Container(
                  margin: const EdgeInsets.symmetric(
                      vertical: PsDimens.space6, horizontal: PsDimens.space16),
                  height: PsDimens.space40,
                  child: InkWell(
                    highlightColor: PsColors.achromatic100,
                    onTap: () {
                      PsBottomSheet.show(
                          context,
                          PsHTMLTextWidget(
                            htmlData:
                                aboutUsProvider.aboutUs.data!.safetyTips ?? '',
                          ),
                          title: 'safety_tips_tile__title'.tr);
                    },
                    child: Ink(
                      child: Container(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: <Widget>[
                            Text('safety_tips_tile__title'.tr,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium!
                                    .copyWith(
                                      fontWeight: FontWeight.w500,
                                      fontSize: 18,
                                      color: Utils.isLightMode(context)
                                          ? PsColors.text800
                                          : PsColors.text50,
                                    )),
                            const Icon(Icons.chevron_right_outlined)
                          ],
                        ),
                      ),
                    ),
                  ),
                )
              : const SizedBox());
    });
  }
}
