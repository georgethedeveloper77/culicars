import 'package:flutter/material.dart';
import 'package:flutter_linkify/flutter_linkify.dart';
import 'package:provider/provider.dart';
import '../../../../../../../../config/ps_colors.dart';

import '../../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../core/vendor/provider/product/item_entry_provider.dart';
import '../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../core/vendor/repository/item_entry_field_repository.dart';
import '../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../core/vendor/viewobject/custom_field.dart';
import '../../../../../../core/vendor/viewobject/holder/request_path_holder.dart';
import '../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../core/vendor/viewobject/product_relation.dart';
import '../../../../../../core/vendor/viewobject/selected_object.dart';
import '../../../../../../core/vendor/viewobject/selected_value.dart';
import '../../../../../custom_ui/item/detail/component/tiles/widgets/vehicle_detail_core_field_widget.dart';
import '../../../../common/custom_ui/ps_detail_custom_widget.dart';
import '../../../../common/ps_bottom_sheet.dart';

class VehicleDetailsTileView extends StatelessWidget {
  const VehicleDetailsTileView({
    Key? key,
    required this.animationController,
  }) : super(key: key);

  final AnimationController animationController;

  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider itemDetailProvider =
        Provider.of<ItemDetailProvider>(context);
    final Product itemData = itemDetailProvider.product;
    return SliverToBoxAdapter(
        child: Container(
      margin: const EdgeInsets.symmetric(
          vertical: PsDimens.space6, horizontal: PsDimens.space16),
      height: PsDimens.space40,
      child: InkWell(
        highlightColor: PsColors.achromatic100,
        onTap: () {
          PsBottomSheet.show(
              context,
              VehicleDetailsWidget(
                  itemData: itemData, animationController: animationController),
              title: 'vehicle_detail'.tr);
        },
        child: Ink(
          child: Container(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text('vehicle_detail'.tr,
                    style: Theme.of(context).textTheme.bodyMedium!.copyWith(
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
    ));
  }
}

class VehicleDetailsWidget extends StatelessWidget {
  const VehicleDetailsWidget(
      {required this.itemData, required this.animationController});
  final Product itemData;
  final AnimationController animationController;
  @override
  Widget build(BuildContext context) {
    final List<String> removeIdList = <String>[
      'ps-itm00015', //plate
      'ps-itm00016', //engine power
      'ps-itm00014', //transmission
      'ps-itm00026', //mileage
      'ps-itm00027', //licence expiration date
      'ps-itm00022', //year
      'ps-itm00004', //condition
    ];
    final PsValueHolder valueHolder = Provider.of<PsValueHolder>(context);
    final AppLocalization langProvider = Provider.of<AppLocalization>(context);
    // final Animation<double> animation = curveAnimation(animationController);
    return ChangeNotifierProvider<ItemEntryFieldProvider?>(
        lazy: false,
        create: (BuildContext context) {
          final ItemEntryFieldProvider itemEntryFieldProvider =
              ItemEntryFieldProvider(
                  repo: Provider.of<ItemEntryFieldRepository>(context,
                      listen: false));
          itemEntryFieldProvider.loadData(
              requestPathHolder: RequestPathHolder(
                  loginUserId: Utils.checkUserLoginId(valueHolder),
                  languageCode: langProvider.currentLocale.languageCode));
          return itemEntryFieldProvider;
        },
        child: Consumer<ItemEntryFieldProvider>(builder: (BuildContext context,
            ItemEntryFieldProvider provider, Widget? child) {
          final List<CustomField> customFieldList =
              provider.itemEntryField.data?.customField ?? <CustomField>[];
          for (String id in removeIdList)
            customFieldList
                .removeWhere((CustomField element) => element.coreKeyId == id);
          provider.categoryCoreField =
              provider.getCoreFieldByFieldName(PsConst.FIELD_NAME_CATEGORY);
          provider.subCategoryCoreField =
              provider.getCoreFieldByFieldName(PsConst.FIELD_NAME_SUBCATEGORY);
          return Column(
            children: <Widget>[
              Linkify(
                onOpen: Utils.linkifyLinkOpen,
                text: itemData.description ?? '',
                style: Theme.of(context).textTheme.bodyMedium!.copyWith(
                    fontWeight: FontWeight.w300,
                    fontSize: 14,
                    color: Utils.isLightMode(context)
                        ? PsColors.text900
                        : PsColors.text50),
                linkStyle: Theme.of(context).textTheme.bodyMedium!.copyWith(
                      color: PsColors.info700,
                      fontSize: 14,
                    ),
              ),

              // Text(itemData.description ?? '',
              //     style: Theme.of(context).textTheme.bodyMedium!.copyWith(
              //         fontWeight: FontWeight.w300,
              //         fontSize: 14,
              //         color: Utils.isLightMode(context)
              //             ? PsColors.text900
              //             : PsColors.text50)),
              //manufacturer
              CustomVehicleDetailCoreFieldWidget(
                  coreField: provider.categoryCoreField,
                  value: itemData.category?.catName ?? ''),
              //model
              CustomVehicleDetailCoreFieldWidget(
                  coreField: provider.subCategoryCoreField,
                  value: itemData.subCategory?.name ?? ''),
              if (provider.hasData)
                ListView.builder(
                    shrinkWrap: true,
                    padding: EdgeInsets.zero,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: customFieldList.length,
                    itemBuilder: (BuildContext context, int index) {
                      final CustomField customField = customFieldList[index];
                      final TextEditingController valueTextController =
                          TextEditingController();
                      final TextEditingController idTextController =
                          TextEditingController();

                      if (customField.coreKeyId != null) {
                        itemData.productRelation
                            ?.forEach((ProductRelation element) {
                          if (element.coreKeyId == customField.coreKeyId &&
                              element.selectedValues!.isNotEmpty) {
                            if (customField.uiType?.coreKeyId !=
                                PsConst.MULTI_SELECTION) {
                              idTextController.text =
                                  element.selectedValues?[0].id.toString() ??
                                      '';
                              valueTextController.text =
                                  element.selectedValues?[0].value! ?? '';
                            } else {
                              final List<String> idList = <String>[];
                              final List<String> values = <String>[];
                              element.selectedValues
                                  ?.forEach((SelectedValue element) {
                                idList.add(element.id.toString());
                                values.add(element.value.toString());
                              });
                              idTextController.text = idList.join(',');
                              valueTextController.text = values.join(',');
                            }
                          }
                        });
                        //  }

                        if (!provider.textControllerMap
                            .containsKey(customField)) {
                          provider.textControllerMap.putIfAbsent(
                            customField,
                            () => SelectedObject(
                              valueTextController: valueTextController,
                              idTextController: idTextController,
                            ),
                          );
                        }
                      }
                      return PsDetailCustomWidget(
                        customField: customField,
                        valueTextController: valueTextController,
                        idTextController: idTextController,
                      );
                    })
            ],
          );
        }));
  }
}
